use axum::{
    routing::{get, delete},
    Router, Json, extract::{State, Path},
};
use axum_prometheus::PrometheusMetricLayer;
use tower_http::trace::{DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer};
use tracing::{Level, info};
use tokio_util::sync::CancellationToken;
use reqwest::StatusCode;

use crate::state::AppState;
use crate::error::MyError;
use crate::models::{User, Farm, Field, Event, FarmRecord, SoilAnalysis};

// Central API Router
pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/v0/hello", get(|| async {
            Ok::<_, MyError>(Json(serde_json::json!({ "message": "hello" })))
        }))
        .route("/v0/users", get(list_users).post(create_user))
        .route("/v0/farms", get(list_farms).post(create_farm))
        .route("/v0/farms/{id}", delete(delete_farm))
        .route("/v0/fields", get(list_fields).post(create_field))
        .route("/v0/fields/{id}", delete(delete_field))
        .route("/v0/events", get(list_events).post(create_event))
        .route("/v0/soil_analyses", get(list_soil_analyses).post(create_soil_analysis))
        .route("/v0/soil_analyses/{id}", delete(delete_soil_analysis))
        .route("/v0/farm_records", get(list_farm_records).post(create_farm_record))
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
        .layer(metric_layer);

    let host = state.config.webservice.address.host_str().unwrap_or("0.0.0.0");
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

async fn list_users(State(state): State<AppState>) -> Result<Json<Vec<User>>, MyError> {
    let users = sqlx::query_as::<_, User>("SELECT id, name, email FROM users")
        .fetch_all(&state.db_pool)
        .await;
    Ok(Json(users?))
}
async fn create_user(State(state): State<AppState>, Json(user): Json<User>) -> Result<Json<User>, MyError> {
    let new_user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email"
    )
    .bind(&user.name)
    .bind(&user.email)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_user?))
}

async fn list_farms(State(state): State<AppState>) -> Result<Json<Vec<Farm>>, MyError> {
    let farms = sqlx::query_as::<_, Farm>("SELECT id, user_id, name, location FROM farms WHERE user_id = 1")
        .fetch_all(&state.db_pool)
        .await;
    Ok(Json(farms?))
}
async fn create_farm(State(state): State<AppState>, Json(farm): Json<Farm>) -> Result<Json<Farm>, MyError> {
    let new_farm = sqlx::query_as::<_, Farm>(
        "INSERT INTO farms (user_id, name, location) VALUES ($1, $2, $3) RETURNING id, user_id, name, location"
    )
    .bind(1i64)
    .bind(&farm.name)
    .bind(&farm.location)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_farm?))
}
async fn delete_farm(State(state): State<AppState>, Path(id): Path<i64>) -> Result<StatusCode, MyError> {
    sqlx::query("DELETE FROM farms WHERE id = $1 AND user_id = 1")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_fields(State(state): State<AppState>) -> Result<Json<Vec<Field>>, MyError> {
    let fields = sqlx::query_as::<_, Field>(
        "SELECT f.id, f.farm_id, f.name, f.area_hectares FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(fields?))
}
async fn create_field(State(state): State<AppState>, Json(field): Json<Field>) -> Result<Json<Field>, MyError> {
    let new_field = sqlx::query_as::<_, Field>(
        "INSERT INTO fields (farm_id, name, area_hectares) VALUES ($1, $2, $3) RETURNING id, farm_id, name, area_hectares"
    )
    .bind(field.farm_id)
    .bind(&field.name)
    .bind(field.area_hectares)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_field?))
}
async fn delete_field(State(state): State<AppState>, Path(id): Path<i64>) -> Result<StatusCode, MyError> {
    sqlx::query("DELETE FROM fields WHERE id = $1 AND farm_id IN (SELECT id FROM farms WHERE user_id = 1)")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_events(State(state): State<AppState>) -> Result<Json<Vec<Event>>, MyError> {
    let events = sqlx::query_as::<_, Event>(
        "SELECT e.id, e.field_id, e.event_type, e.description, e.date FROM events e JOIN fields f ON e.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(events?))
}
async fn create_event(State(state): State<AppState>, Json(event): Json<Event>) -> Result<Json<Event>, MyError> {
    let new_event = sqlx::query_as::<_, Event>(
        "INSERT INTO events (field_id, event_type, description, date) VALUES ($1, $2, $3, $4) RETURNING id, field_id, event_type, description, date"
    )
    .bind(event.field_id)
    .bind(&event.event_type)
    .bind(&event.description)
    .bind(&event.date)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_event?))
}

async fn list_farm_records(State(state): State<AppState>) -> Result<Json<Vec<FarmRecord>>, MyError> {
    let records = sqlx::query_as::<_, FarmRecord>(
        "SELECT fr.id, fr.farm_id, fr.agricultural_area, fr.manure_storage_capacity, fr.year FROM farm_records fr JOIN farms fa ON fr.farm_id = fa.id WHERE fa.user_id = 1"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(records?))
}
async fn create_farm_record(State(state): State<AppState>, Json(record): Json<FarmRecord>) -> Result<Json<FarmRecord>, MyError> {
    let new_record = sqlx::query_as::<_, FarmRecord>(
        "INSERT INTO farm_records (farm_id, agricultural_area, manure_storage_capacity, year) VALUES ($1, $2, $3, $4) RETURNING id, farm_id, agricultural_area, manure_storage_capacity, year"
    )
    .bind(record.farm_id)
    .bind(record.agricultural_area)
    .bind(record.manure_storage_capacity)
    .bind(record.year)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_record?))
}


async fn list_soil_analyses(State(state): State<AppState>) -> Result<Json<Vec<SoilAnalysis>>, MyError> {
    let analyses = sqlx::query_as::<_, SoilAnalysis>(
        "SELECT sa.id, sa.field_id, sa.sample_date, sa.ph_level, sa.phosphorus_index, sa.potassium_index, sa.magnesium_index FROM soil_analyses sa JOIN fields f ON sa.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(analyses?))
}

async fn create_soil_analysis(State(state): State<AppState>, Json(analysis): Json<SoilAnalysis>) -> Result<Json<SoilAnalysis>, MyError> {
    let new_analysis = sqlx::query_as::<_, SoilAnalysis>(
        "INSERT INTO soil_analyses (field_id, sample_date, ph_level, phosphorus_index, potassium_index, magnesium_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, field_id, sample_date, ph_level, phosphorus_index, potassium_index, magnesium_index"
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

async fn delete_soil_analysis(State(state): State<AppState>, Path(id): Path<i64>) -> Result<StatusCode, MyError> {
    sqlx::query("DELETE FROM soil_analyses WHERE id = $1 AND field_id IN (SELECT f.id FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1)")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}
#[cfg(test)]
mod tests;
