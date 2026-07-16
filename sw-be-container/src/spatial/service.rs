use crate::error::AppError;
use crate::spatial::models::{Extents, ExtentsResponse, Point};
use geo::{BoundingRect, Geometry};
use sqlx::PgPool;
use std::convert::TryFrom;

pub struct SpatialService;

impl SpatialService {
    // References more than 3 PRDs
    pub async fn validate_application_area(
        pool: &PgPool,
        field_id: i64,
        application_geom_geojson: &str,
        is_organic: bool,
    ) -> Result<(), AppError> {
        // 1. Check if application is within field boundary
        let is_within_field = sqlx::query_scalar::<_, bool>(
            "SELECT ST_Within(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), geom) FROM fields WHERE id = $2",
        )
        .bind(application_geom_geojson)
        .bind(field_id)
        .fetch_optional(pool)
        .await?
        .unwrap_or(false);

        if !is_within_field {
            return Err(AppError::BadRequest(
                "Application area is outside the field boundary.".to_string(),
            ));
        }

        // 2. Check for waterway buffer intersections
        // Rules: 2m for chemical, 10m for organic (simplified for now)
        let buffer_distance = if is_organic { 10.0 } else { 2.0 };

        let intersection_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM waterways
             WHERE ST_Intersects(
                ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
                ST_Buffer(geom::geography, $2)::geometry
             ) AND is_deleted = FALSE",
        )
        .bind(application_geom_geojson)
        .bind(buffer_distance)
        .fetch_one(pool)
        .await?;

        if intersection_count > 0 {
            return Err(AppError::BadRequest(format!(
                "Application intersects with a {}m waterway buffer zone.",
                buffer_distance
            )));
        }

        Ok(())
    }

    // PRD Reference: 0001
    pub async fn get_buffer_geometries_geojson(
        pool: &PgPool,
        distance_meters: f64,
    ) -> Result<String, AppError> {
        let geojson = sqlx::query_scalar::<_, String>(
            "SELECT ST_AsGeoJSON(ST_Union(ST_Buffer(geom::geography, $1)::geometry)) FROM waterways WHERE is_deleted = FALSE"
        )
        .bind(distance_meters)
        .fetch_one(pool)
        .await?;
        Ok(geojson)
    }

    // PRD Reference: 0004
    pub fn calculate_extents(
        geometries: Vec<geojson::Geometry>,
    ) -> Result<ExtentsResponse, AppError> {
        if geometries.is_empty() {
            return Err(AppError::BadRequest(
                "No geometries provided to calculate extents.".to_string(),
            ));
        }

        let mut geo_geometries = Vec::with_capacity(geometries.len());
        for gj in geometries {
            match Geometry::try_from(gj) {
                Ok(geo) => geo_geometries.push(geo),
                Err(_) => {
                    return Err(AppError::BadRequest(
                        "Failed to convert GeoJSON geometry to valid geographic geometry."
                            .to_string(),
                    ));
                }
            }
        }

        if geo_geometries.is_empty() {
            return Err(AppError::BadRequest(
                "No valid geometries found to calculate extents.".to_string(),
            ));
        }

        let geom_collection = geo::GeometryCollection::new_from(geo_geometries);

        let rect = geom_collection.bounding_rect().ok_or_else(|| {
            AppError::BadRequest(
                "Could not calculate bounding rectangle for the provided geometries.".to_string(),
            )
        })?;

        let min = rect.min();
        let max = rect.max();

        let extents = Extents {
            min_x: min.x,
            max_x: max.x,
            min_y: min.y,
            max_y: max.y,
        };

        let center = Point {
            x: (min.x + max.x) / 2.0,
            y: (min.y + max.y) / 2.0,
        };

        Ok(ExtentsResponse { center, extents })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_extents_empty() {
        let result = SpatialService::calculate_extents(vec![]);
        assert!(result.is_err());
    }

    #[test]
    fn test_calculate_extents_single_polygon() {
        let geo_poly = geo::Geometry::Polygon(geo::Polygon::new(
            geo::LineString::from(vec![
                (0.0, 0.0),
                (10.0, 0.0),
                (10.0, 10.0),
                (0.0, 10.0),
                (0.0, 0.0),
            ]),
            vec![],
        ));
        let polygon = geojson::Geometry::try_from(&geo_poly).unwrap();

        let result = SpatialService::calculate_extents(vec![polygon]).unwrap();

        assert_eq!(result.extents.min_x, 0.0);
        assert_eq!(result.extents.max_x, 10.0);
        assert_eq!(result.extents.min_y, 0.0);
        assert_eq!(result.extents.max_y, 10.0);

        assert_eq!(result.center.x, 5.0);
        assert_eq!(result.center.y, 5.0);
    }

    #[test]
    fn test_calculate_extents_multiple_geometries() {
        let geo_poly = geo::Geometry::Polygon(geo::Polygon::new(
            geo::LineString::from(vec![
                (0.0, 0.0),
                (10.0, 0.0),
                (10.0, 10.0),
                (0.0, 10.0),
                (0.0, 0.0),
            ]),
            vec![],
        ));
        let polygon = geojson::Geometry::try_from(&geo_poly).unwrap();

        let geo_point = geo::Geometry::Point(geo::Point::new(20.0, 20.0));
        let point = geojson::Geometry::try_from(&geo_point).unwrap();

        let result = SpatialService::calculate_extents(vec![polygon, point]).unwrap();

        assert_eq!(result.extents.min_x, 0.0);
        assert_eq!(result.extents.max_x, 20.0);
        assert_eq!(result.extents.min_y, 0.0);
        assert_eq!(result.extents.max_y, 20.0);

        assert_eq!(result.center.x, 10.0);
        assert_eq!(result.center.y, 10.0);
    }
}
