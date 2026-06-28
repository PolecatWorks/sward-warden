use crate::error::AppError;
use sqlx::PgPool;

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

    // PRD Reference: 0001, 0009
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
}
