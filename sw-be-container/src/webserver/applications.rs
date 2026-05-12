use crate::error::AppError;
use crate::models::{Event, Farm, FertiliserApplication, Field, OrganicManureApplication};
use crate::rules::{
    ValidationResult, validate_fertiliser_application, validate_organic_manure_application,
};
use crate::state::AppState;
use axum::{Json, extract::State};

pub async fn list_fertiliser_applications(
    State(state): State<AppState>,
) -> Result<Json<Vec<FertiliserApplication>>, AppError> {
    let apps = sqlx::query_as::<_, FertiliserApplication>(
        "SELECT id, event_id, fertiliser_type, amount_applied, nitrogen_content, phosphorus_content, is_protected_urea, buffer_zone_confirmed, evidence_of_control, updated_at, is_deleted FROM fertiliser_applications WHERE is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(apps?))
}

pub async fn create_fertiliser_application(
    State(state): State<AppState>,
    Json(app): Json<FertiliserApplication>,
) -> Result<Json<FertiliserApplication>, AppError> {
    // Fetch Event and Field for validation
    let event = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE id = $1")
        .bind(app.event_id)
        .fetch_one(&state.db_pool)
        .await?;

    let field = sqlx::query_as::<_, Field>("SELECT * FROM fields WHERE id = $1")
        .bind(event.field_id)
        .fetch_one(&state.db_pool)
        .await?;

    match validate_fertiliser_application(&event, &app, &field) {
        ValidationResult::Valid => (),
        ValidationResult::Invalid(reason) => return Err(AppError::BadRequest(reason)),
    }

    // Weather Validation
    let application_date =
        chrono::DateTime::parse_from_rfc3339(&format!("{}T12:00:00Z", event.date))
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now());

    // In a real app, we'd parse lat/lon from farm.location or separate fields
    crate::weather::WeatherService::validate_application_safety(0.0, 0.0, application_date).await?;

    // Spatial Validation
    if let Some(ref wkt) = app.geometry_wkt {
        crate::spatial::SpatialService::validate_application_area(
            &state.db_pool,
            field.id.unwrap(),
            wkt,
            false,
        )
        .await?;
    }

    let new_app = sqlx::query_as::<_, FertiliserApplication>(
        "INSERT INTO fertiliser_applications (event_id, fertiliser_type, amount_applied, nitrogen_content, phosphorus_content, is_protected_urea, buffer_zone_confirmed, evidence_of_control) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, event_id, fertiliser_type, amount_applied, nitrogen_content, phosphorus_content, is_protected_urea, buffer_zone_confirmed, evidence_of_control, updated_at, is_deleted"
    )
    .bind(app.event_id)
    .bind(&app.fertiliser_type)
    .bind(app.amount_applied)
    .bind(app.nitrogen_content)
    .bind(app.phosphorus_content)
    .bind(app.is_protected_urea)
    .bind(app.buffer_zone_confirmed)
    .bind(&app.evidence_of_control)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_app?))
}

pub async fn list_organic_manure_applications(
    State(state): State<AppState>,
) -> Result<Json<Vec<OrganicManureApplication>>, AppError> {
    let apps = sqlx::query_as::<_, OrganicManureApplication>(
        "SELECT id, event_id, manure_type, volume_applied_m3_per_ha, weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit, is_lesse_applied, weather_conditions_confirmed, buffer_zone_distance_meters, equipment_used, lesse_exemption_reason, updated_at, is_deleted FROM organic_manure_applications WHERE is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(apps?))
}

pub async fn create_organic_manure_application(
    State(state): State<AppState>,
    Json(app): Json<OrganicManureApplication>,
) -> Result<Json<OrganicManureApplication>, AppError> {
    let event = sqlx::query_as::<_, Event>("SELECT * FROM events WHERE id = $1")
        .bind(app.event_id)
        .fetch_one(&state.db_pool)
        .await?;

    let field = sqlx::query_as::<_, Field>("SELECT * FROM fields WHERE id = $1")
        .bind(event.field_id)
        .fetch_one(&state.db_pool)
        .await?;

    let farm = sqlx::query_as::<_, Farm>("SELECT * FROM farms WHERE id = $1")
        .bind(field.farm_id)
        .fetch_one(&state.db_pool)
        .await?;

    // Weather Validation
    let application_date =
        chrono::DateTime::parse_from_rfc3339(&format!("{}T12:00:00Z", event.date))
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now());

    // In a real app, we'd parse lat/lon from farm.location or separate fields
    crate::weather::WeatherService::validate_application_safety(0.0, 0.0, application_date).await?;

    // Spatial Validation
    if let Some(ref wkt) = app.geometry_wkt {
        crate::spatial::SpatialService::validate_application_area(
            &state.db_pool,
            field.id.unwrap(),
            wkt,
            true,
        )
        .await?;
    }

    // Fetch previous apps for 3-week gap rule
    let previous_apps = sqlx::query_as::<_, Event>(
        "SELECT * FROM events WHERE field_id = $1 AND (event_type ILIKE '%slurry%' OR event_type ILIKE '%manure%') AND date != $2"
    )
    .bind(field.id)
    .bind(&event.date)
    .fetch_all(&state.db_pool)
    .await?;

    match validate_organic_manure_application(&event, &app, &field, &farm, &previous_apps) {
        ValidationResult::Valid => (),
        ValidationResult::Invalid(reason) => return Err(AppError::BadRequest(reason)),
    }

    let new_app = sqlx::query_as::<_, OrganicManureApplication>(
        "INSERT INTO organic_manure_applications (event_id, manure_type, volume_applied_m3_per_ha, weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit, is_lesse_applied, weather_conditions_confirmed, buffer_zone_distance_meters, equipment_used, lesse_exemption_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, event_id, manure_type, volume_applied_m3_per_ha, weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit, is_lesse_applied, weather_conditions_confirmed, buffer_zone_distance_meters, updated_at, is_deleted, equipment_used, lesse_exemption_reason"
    )
    .bind(app.event_id)
    .bind(&app.manure_type)
    .bind(app.volume_applied_m3_per_ha)
    .bind(app.weight_applied_tonnes_per_ha)
    .bind(app.nitrogen_content_kg_per_unit)
    .bind(app.is_lesse_applied)
    .bind(app.weather_conditions_confirmed)
    .bind(app.buffer_zone_distance_meters)
    .bind(&app.equipment_used)
    .bind(&app.lesse_exemption_reason)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_app?))
}
