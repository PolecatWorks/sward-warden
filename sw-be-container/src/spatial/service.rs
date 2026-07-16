use crate::config::SpatialConfig;
use crate::error::AppError;
use crate::spatial::models::{Extents, ExtentsResponse, Point, OfficialBoundary, OfficialBoundaryApiResponse};
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

    // PRD Reference: 0008
    pub fn calculate_area_from_polygon(geojson_str: &str) -> Result<f64, AppError> {
        use geo::GeodesicArea;

        // Parse the GeoJSON string
        let geojson = geojson_str
            .parse::<geojson::GeoJson>()
            .map_err(|e| AppError::BadRequest(format!("Invalid GeoJSON: {}", e)))?;

        // Extract geometry from the GeoJson object
        let geometry = match geojson {
            geojson::GeoJson::Geometry(geom) => geom,
            geojson::GeoJson::Feature(feature) => feature.geometry.ok_or_else(|| {
                AppError::BadRequest("Feature does not contain a geometry".to_string())
            })?,
            _ => {
                return Err(AppError::BadRequest(
                    "GeoJSON must be a Geometry or a Feature containing a geometry".to_string(),
                ));
            }
        };

        // Convert geojson::Geometry to geo::Geometry
        let geo_geom = geo::Geometry::try_from(geometry).map_err(|_| {
            AppError::BadRequest(
                "Failed to convert GeoJSON geometry to valid geographic geometry".to_string(),
            )
        })?;

        // Calculate geodesic area using the WGS84 ellipsoid
        let area = match &geo_geom {
            geo::Geometry::Polygon(poly) => poly.geodesic_area_unsigned(),
            geo::Geometry::MultiPolygon(mpoly) => mpoly.geodesic_area_unsigned(),
            geo::Geometry::GeometryCollection(gc) => {
                fn get_collection_area(collection: &geo::GeometryCollection) -> f64 {
                    collection
                        .iter()
                        .map(|g| match g {
                            geo::Geometry::Polygon(p) => p.geodesic_area_unsigned(),
                            geo::Geometry::MultiPolygon(mp) => mp.geodesic_area_unsigned(),
                            geo::Geometry::GeometryCollection(sub_gc) => {
                                get_collection_area(sub_gc)
                            }
                            _ => 0.0,
                        })
                        .sum()
                }
                get_collection_area(gc)
            }
            _ => {
                return Err(AppError::BadRequest(
                    "Geometry type is not supported for area calculation. Must be Polygon or MultiPolygon.".to_string(),
                ));
            }
        };

        Ok(area)
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

    pub async fn get_cached_boundary_by_point(
        pool: &PgPool,
        lat: f64,
        lon: f64,
    ) -> Result<Option<OfficialBoundary>, AppError> {
        // Construct a Point using PostGIS
        let point_wkt = format!("POINT({} {})", lon, lat);

        let boundary = sqlx::query_as::<_, OfficialBoundary>(
            r#"
            SELECT
                id,
                sbi,
                parcel_id,
                ST_AsGeoJSON(geom) as geometry_geojson,
                source
            FROM official_field_boundaries
            WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromText($1), 4326))
            LIMIT 1
            "#,
        )
        .bind(point_wkt)
        .fetch_optional(pool)
        .await?;

        Ok(boundary)
    }

    // PRD Reference: 0008
    pub async fn cache_new_boundary(
        pool: &PgPool,
        sbi: &str,
        parcel_id: &str,
        polygon_geojson: &str,
        source: &str,
    ) -> Result<OfficialBoundary, AppError> {
        let boundary = sqlx::query_as::<_, OfficialBoundary>(
            r#"
            INSERT INTO official_field_boundaries (sbi, parcel_id, geom, source)
            VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326), $4)
            RETURNING
                id,
                sbi,
                parcel_id,
                ST_AsGeoJSON(geom) as geometry_geojson,
                source
            "#,
        )
        .bind(sbi)
        .bind(parcel_id)
        .bind(polygon_geojson)
        .bind(source)
        .fetch_one(pool)
        .await?;

        Ok(boundary)
    }

    // PRD Reference: 0008
    pub async fn fetch_boundary_from_official_api(
        config: &SpatialConfig,
        lat: f64,
        lon: f64,
    ) -> Result<OfficialBoundaryApiResponse, AppError> {
        let api_url = config.official_boundary_api_url.as_ref().ok_or_else(|| {
            AppError::Message("Official boundary API URL is not configured".to_string())
        })?;

        let mut url = api_url.clone();
        url.query_pairs_mut()
            .append_pair("lat", &lat.to_string())
            .append_pair("lon", &lon.to_string());

        let client = reqwest::Client::new();
        let mut request_builder = client.get(url.clone());

        if let Some(api_key) = &config.official_boundary_api_key {
            request_builder =
                request_builder.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = request_builder
            .send()
            .await
            .map_err(|e| AppError::Message(format!("Failed to fetch from official API: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Message(format!(
                "Official API returned error status: {}",
                response.status()
            )));
        }

        let api_response = response
            .json::<OfficialBoundaryApiResponse>()
            .await
            .map_err(|e| {
                AppError::Message(format!("Failed to parse response from official API: {}", e))
            })?;

        Ok(api_response)
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

    #[test]
    fn test_calculate_area_from_polygon() {
        // A 1-degree square box around equator
        let geojson_str = r#"{
            "type": "Polygon",
            "coordinates": [
                [
                    [0.0, 0.0],
                    [1.0, 0.0],
                    [1.0, 1.0],
                    [0.0, 1.0],
                    [0.0, 0.0]
                ]
            ]
        }"#;

        let area = SpatialService::calculate_area_from_polygon(geojson_str).unwrap();
        // 1 degree latitude is approx 111km, 1 degree longitude at equator is approx 111km.
        // Area of 1x1 deg box should be approx 1.23e10 square meters. Let's assert it is in a reasonable range.
        assert!(area > 1.2e10 && area < 1.3e10);
    }
}
