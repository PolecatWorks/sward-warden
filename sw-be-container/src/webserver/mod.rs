use axum::{
    Json, Router,
    extract::{Path, Query, State},
    routing::{delete, get},
};
use axum_prometheus::PrometheusMetricLayer;
use chrono::{DateTime, Utc};
use reqwest::StatusCode;
use tokio_util::sync::CancellationToken;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::{Level, info};

use crate::error::MyError;
use crate::models::{
    Event, Farm, FarmRecord, FertilisationPlan, FertiliserApplication, Field, OrganicManureApplication, SoilAnalysis,
    SyncQuery, SyncResponse, User,
};
use crate::rules::{validate_fertiliser_application, validate_organic_manure_application, ValidationResult};
use crate::state::AppState;

// Central API Router
pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route(
            "/v0/hello",
            get(|| async { Ok::<_, MyError>(Json(serde_json::json!({ "message": "hello" }))) }),
        )
        .route("/v0/users", get(list_users).post(create_user))
        .route("/v0/farms", get(list_farms).post(create_farm))
        .route("/v0/farms/{id}", delete(delete_farm))
        .route("/v0/farms/{farm_id}/soil-analyses", get(list_soil_analyses))
        .route("/v0/fields", get(list_fields).post(create_field))
        .route("/v0/fields/{id}", delete(delete_field))
        .route("/v0/events", get(list_events).post(create_event))
        .route("/v0/fertiliser-applications", get(list_fertiliser_applications).post(create_fertiliser_application))
        .route("/v0/organic-manure-applications", get(list_organic_manure_applications).post(create_organic_manure_application))
        .route("/v0/sync/delta", get(delta_sync))
        .route(
            "/v0/soil_analyses",
            get(list_soil_analyses).post(create_soil_analysis),
        )
        .route("/v0/soil_analyses/{id}", delete(delete_soil_analysis))
        .route(
            "/v0/fertilisation_plans",
            get(list_fertilisation_plans).post(create_fertilisation_plan),
        )
        .route(
            "/v0/fertilisation_plans/{id}",
            delete(delete_fertilisation_plan),
        )
        .route(
            "/v0/farm_records",
            get(list_farm_records).post(create_farm_record),
        )
        .route(
            "/v0/fertiliser_applications",
            get(list_fertiliser_applications).post(create_fertiliser_application),
        )
        .route("/v0/sync", get(delta_sync))
        .with_state(state)
}

pub async fn start_app_api(state: AppState, ct: CancellationToken) -> Result<(), MyError> {
    let metric_layer = PrometheusMetricLayer::new();
    let app = app_router(state.clone())
        .layer(
            TraceLayer::new_for_http()
                .on_request(DefaultOnRequest::new().level(Level::DEBUG))
                .on_response(DefaultOnResponse::new().level(Level::DEBUG))
                .on_failure(DefaultOnFailure::new().level(Level::ERROR)),
        )
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(metric_layer);

    let host = state
        .config
        .webservice
        .address
        .host_str()
        .unwrap_or("0.0.0.0");
    let port = state.config.webservice.address.port().unwrap_or(8080);

    let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port)).await?;
    info!("Server started on {}:{}", host, port);

    axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            ct.cancelled().await;
            info!("Received cancellation token, shutting down web server");
        })
        .await?;

    Ok(())
}

// ──────────────────────────────────────────────────────────
// Users (unchanged — no sync tracking on users)
// ──────────────────────────────────────────────────────────

async fn list_users(State(state): State<AppState>) -> Result<Json<Vec<User>>, MyError> {
    let users = sqlx::query_as::<_, User>("SELECT id, name, email FROM users")
        .fetch_all(&state.db_pool)
        .await;
    Ok(Json(users?))
}
async fn create_user(
    State(state): State<AppState>,
    Json(user): Json<User>,
) -> Result<Json<User>, MyError> {
    let new_user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email",
    )
    .bind(&user.name)
    .bind(&user.email)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_user?))
}

// ──────────────────────────────────────────────────────────
// Farms
// ──────────────────────────────────────────────────────────

async fn list_farms(State(state): State<AppState>) -> Result<Json<Vec<Farm>>, MyError> {
    if let Some(cached_farms) = &*state.farms_cache.read().await {
        return Ok(Json(cached_farms.clone()));
    }

    let farms = sqlx::query_as::<_, Farm>(
        "SELECT id, user_id, name, location, updated_at, is_deleted FROM farms WHERE user_id = 1 AND is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = Some(farms.clone());
    Ok(Json(farms))
}
async fn create_farm(
    State(state): State<AppState>,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, MyError> {
    let new_farm = sqlx::query_as::<_, Farm>(
        "INSERT INTO farms (user_id, name, location) VALUES ($1, $2, $3) RETURNING id, user_id, name, location, updated_at, is_deleted"
    )
    .bind(1i64)
    .bind(&farm.name)
    .bind(&farm.location)
    .fetch_one(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = None;
    Ok(Json(new_farm))
}
async fn delete_farm(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, MyError> {
    sqlx::query(
        "UPDATE farms SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = 1",
    )
    .bind(id)
    .execute(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = None;
    Ok(StatusCode::NO_CONTENT)
}

// ──────────────────────────────────────────────────────────
// Fields
// ──────────────────────────────────────────────────────────

async fn list_fields(State(state): State<AppState>) -> Result<Json<Vec<Field>>, MyError> {
    let fields = sqlx::query_as::<_, Field>(
        "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND f.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(fields?))
}
async fn create_field(
    State(state): State<AppState>,
    Json(field): Json<Field>,
) -> Result<Json<Field>, MyError> {
    let new_field = sqlx::query_as::<_, Field>(
        "INSERT INTO fields (farm_id, name, area_hectares) VALUES ($1, $2, $3) RETURNING id, farm_id, name, area_hectares, updated_at, is_deleted"
    )
    .bind(field.farm_id)
    .bind(&field.name)
    .bind(field.area_hectares)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_field?))
}
async fn delete_field(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, MyError> {
    sqlx::query("UPDATE fields SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND farm_id IN (SELECT id FROM farms WHERE user_id = 1)")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

// ──────────────────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────────────────

async fn list_events(State(state): State<AppState>) -> Result<Json<Vec<Event>>, MyError> {
    let events = sqlx::query_as::<_, Event>(
        "SELECT e.id, e.field_id, e.event_type, e.description, e.date, e.updated_at, e.is_deleted, e.mapp_number, e.eppo_code, e.bbch_growth_stage FROM events e JOIN fields f ON e.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND e.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(events?))
}
async fn create_event(
    State(state): State<AppState>,
    Json(event): Json<Event>,
) -> Result<Json<Event>, MyError> {
    let new_event = sqlx::query_as::<_, Event>(
        "INSERT INTO events (field_id, event_type, description, date, mapp_number, eppo_code, bbch_growth_stage) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, field_id, event_type, description, date, updated_at, is_deleted, mapp_number, eppo_code, bbch_growth_stage"
    )
    .bind(event.field_id)
    .bind(&event.event_type)
    .bind(&event.description)
    .bind(&event.date)
    .bind(&event.mapp_number)
    .bind(&event.eppo_code)
    .bind(&event.bbch_growth_stage)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_event?))
}

// ──────────────────────────────────────────────────────────
// Farm Records
// ──────────────────────────────────────────────────────────

async fn list_farm_records(
    State(state): State<AppState>,
) -> Result<Json<Vec<FarmRecord>>, MyError> {
    let records = sqlx::query_as::<_, FarmRecord>(
        "SELECT fr.id, fr.farm_id, fr.agricultural_area, fr.manure_storage_capacity, fr.year, fr.updated_at, fr.is_deleted FROM farm_records fr JOIN farms fa ON fr.farm_id = fa.id WHERE fa.user_id = 1 AND fr.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(records?))
}
async fn create_farm_record(
    State(state): State<AppState>,
    Json(record): Json<FarmRecord>,
) -> Result<Json<FarmRecord>, MyError> {
    let new_record = sqlx::query_as::<_, FarmRecord>(
        "INSERT INTO farm_records (farm_id, agricultural_area, manure_storage_capacity, year) VALUES ($1, $2, $3, $4) RETURNING id, farm_id, agricultural_area, manure_storage_capacity, year, updated_at, is_deleted"
    )
    .bind(record.farm_id)
    .bind(record.agricultural_area)
    .bind(record.manure_storage_capacity)
    .bind(record.year)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_record?))
}

async fn list_fertiliser_applications(
    State(state): State<AppState>,
) -> Result<Json<Vec<FertiliserApplication>>, MyError> {
    let apps = sqlx::query_as::<_, FertiliserApplication>(
        "SELECT id, event_id, fertiliser_type, amount_applied, nitrogen_content, phosphorus_content, is_protected_urea, buffer_zone_confirmed, evidence_of_control, updated_at, is_deleted FROM fertiliser_applications WHERE is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(apps?))
}

async fn create_fertiliser_application(
    State(state): State<AppState>,
    Json(app): Json<FertiliserApplication>,
) -> Result<Json<FertiliserApplication>, MyError> {
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
        ValidationResult::Invalid(reason) => return Err(MyError::BadRequest(reason)),
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

async fn list_organic_manure_applications(
    State(state): State<AppState>,
) -> Result<Json<Vec<OrganicManureApplication>>, MyError> {
    let apps = sqlx::query_as::<_, OrganicManureApplication>(
        "SELECT id, event_id, manure_type, volume_applied_m3_per_ha, weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit, is_lesse_applied, weather_conditions_confirmed, buffer_zone_distance_meters, updated_at, is_deleted FROM organic_manure_applications WHERE is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(apps?))
}

async fn create_organic_manure_application(
    State(state): State<AppState>,
    Json(app): Json<OrganicManureApplication>,
) -> Result<Json<OrganicManureApplication>, MyError> {
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
        ValidationResult::Invalid(reason) => return Err(MyError::BadRequest(reason)),
    }

    let new_app = sqlx::query_as::<_, OrganicManureApplication>(
        "INSERT INTO organic_manure_applications (event_id, manure_type, volume_applied_m3_per_ha, weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit, is_lesse_applied, weather_conditions_confirmed, buffer_zone_distance_meters) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, event_id, manure_type, volume_applied_m3_per_ha, weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit, is_lesse_applied, weather_conditions_confirmed, buffer_zone_distance_meters, updated_at, is_deleted"
    )
    .bind(app.event_id)
    .bind(&app.manure_type)
    .bind(app.volume_applied_m3_per_ha)
    .bind(app.weight_applied_tonnes_per_ha)
    .bind(app.nitrogen_content_kg_per_unit)
    .bind(app.is_lesse_applied)
    .bind(app.weather_conditions_confirmed)
    .bind(app.buffer_zone_distance_meters)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_app?))
}

async fn list_soil_analyses(
    State(state): State<AppState>,
) -> Result<Json<Vec<SoilAnalysis>>, MyError> {
    let analyses = sqlx::query_as::<_, SoilAnalysis>(
        "SELECT sa.id, sa.field_id, sa.sample_date, sa.ph_level, sa.phosphorus_index, sa.potassium_index, sa.magnesium_index, sa.updated_at, sa.is_deleted FROM soil_analyses sa JOIN fields f ON sa.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND sa.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(analyses?))
}

async fn create_soil_analysis(
    State(state): State<AppState>,
    Json(analysis): Json<SoilAnalysis>,
) -> Result<Json<SoilAnalysis>, MyError> {
    let new_analysis = sqlx::query_as::<_, SoilAnalysis>(
        "INSERT INTO soil_analyses (field_id, sample_date, ph_level, phosphorus_index, potassium_index, magnesium_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, field_id, sample_date, ph_level, phosphorus_index, potassium_index, magnesium_index, updated_at, is_deleted"
    )
    .bind(analysis.field_id)
    .bind(&analysis.sample_date)
    .bind(analysis.ph_level)
    .bind(analysis.phosphorus_index)
    .bind(analysis.potassium_index)
    .bind(analysis.magnesium_index)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_analysis?))
}

async fn delete_soil_analysis(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, MyError> {
    sqlx::query("UPDATE soil_analyses SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND field_id IN (SELECT f.id FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1)")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_fertilisation_plans(
    State(state): State<AppState>,
) -> Result<Json<Vec<FertilisationPlan>>, MyError> {
    let plans = sqlx::query_as::<_, FertilisationPlan>(
        "SELECT fp.id, fp.field_id, fp.crop_type, fp.target_yield, fp.nitrogen_requirement, fp.phosphorus_requirement, fp.potassium_requirement, fp.application_date, fp.updated_at, fp.is_deleted FROM fertilisation_plans fp JOIN fields f ON fp.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND fp.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(plans?))
}

async fn create_fertilisation_plan(
    State(state): State<AppState>,
    Json(plan): Json<FertilisationPlan>,
) -> Result<Json<FertilisationPlan>, MyError> {
    let new_plan = sqlx::query_as::<_, FertilisationPlan>(
        "INSERT INTO fertilisation_plans (field_id, crop_type, target_yield, nitrogen_requirement, phosphorus_requirement, potassium_requirement, application_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, field_id, crop_type, target_yield, nitrogen_requirement, phosphorus_requirement, potassium_requirement, application_date, updated_at, is_deleted"
    )
    .bind(plan.field_id)
    .bind(&plan.crop_type)
    .bind(plan.target_yield)
    .bind(plan.nitrogen_requirement)
    .bind(plan.phosphorus_requirement)
    .bind(plan.potassium_requirement)
    .bind(&plan.application_date)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_plan?))
}

async fn delete_fertilisation_plan(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, MyError> {
    sqlx::query("UPDATE fertilisation_plans SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND field_id IN (SELECT f.id FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1)")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

// ──────────────────────────────────────────────────────────
// Delta Sync Endpoint
// ──────────────────────────────────────────────────────────

/// GET /v0/sync?since=<ISO 8601 timestamp>
///
/// Returns all records across all entity types where `updated_at > $since`,
/// including soft-deleted records so the client can remove them locally.
/// If `since` is not provided, returns all records (full sync).
async fn delta_sync(
    State(state): State<AppState>,
    Query(params): Query<SyncQuery>,
) -> Result<Json<SyncResponse>, MyError> {
    let since: DateTime<Utc> = params
        .since
        .unwrap_or_else(|| DateTime::from_timestamp(0, 0).unwrap());

    let farms = sqlx::query_as::<_, Farm>(
        "SELECT id, user_id, name, location, updated_at, is_deleted FROM farms WHERE user_id = 1 AND updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let fields = sqlx::query_as::<_, Field>(
        "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND f.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let events = sqlx::query_as::<_, Event>(
        "SELECT e.id, e.field_id, e.event_type, e.description, e.date, e.updated_at, e.is_deleted, e.mapp_number, e.eppo_code, e.bbch_growth_stage FROM events e JOIN fields f ON e.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND e.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let farm_records = sqlx::query_as::<_, FarmRecord>(
        "SELECT fr.id, fr.farm_id, fr.agricultural_area, fr.manure_storage_capacity, fr.year, fr.updated_at, fr.is_deleted FROM farm_records fr JOIN farms fa ON fr.farm_id = fa.id WHERE fa.user_id = 1 AND fr.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let soil_analyses = sqlx::query_as::<_, SoilAnalysis>(
        "SELECT sa.id, sa.field_id, sa.sample_date, sa.ph_level, sa.phosphorus_index, sa.potassium_index, sa.magnesium_index, sa.updated_at, sa.is_deleted FROM soil_analyses sa JOIN fields f ON sa.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND sa.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let fertilisation_plans = sqlx::query_as::<_, FertilisationPlan>(
        "SELECT fp.id, fp.field_id, fp.crop_type, fp.target_yield, fp.nitrogen_requirement, fp.phosphorus_requirement, fp.potassium_requirement, fp.application_date, fp.updated_at, fp.is_deleted FROM fertilisation_plans fp JOIN fields f ON fp.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND fp.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let fertiliser_applications = sqlx::query_as::<_, FertiliserApplication>(
        "SELECT fa.id, fa.event_id, fa.fertiliser_type, fa.amount_applied, fa.nitrogen_content, fa.phosphorus_content, fa.is_protected_urea, fa.buffer_zone_confirmed, fa.evidence_of_control, fa.updated_at, fa.is_deleted FROM fertiliser_applications fa JOIN events e ON fa.event_id = e.id JOIN fields f ON e.field_id = f.id JOIN farms far ON f.farm_id = far.id WHERE far.user_id = 1 AND fa.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let organic_manure_applications = sqlx::query_as::<_, OrganicManureApplication>(
        "SELECT oma.id, oma.event_id, oma.manure_type, oma.volume_applied_m3_per_ha, oma.weight_applied_tonnes_per_ha, oma.nitrogen_content_kg_per_unit, oma.is_lesse_applied, oma.weather_conditions_confirmed, oma.buffer_zone_distance_meters, oma.updated_at, oma.is_deleted FROM organic_manure_applications oma JOIN events e ON oma.event_id = e.id JOIN fields f ON e.field_id = f.id JOIN farms far ON f.farm_id = far.id WHERE far.user_id = 1 AND oma.updated_at > $1"
    )
    .bind(since)
    .fetch_all(&state.db_pool)
    .await?;

    let checkpoint = Utc::now();

    Ok(Json(SyncResponse {
        checkpoint,
        farms,
        fields,
        events,
        farm_records,
        soil_analyses,
        fertilisation_plans,
        fertiliser_applications,
        organic_manure_applications,
    }))
}

#[cfg(test)]
mod tests;
