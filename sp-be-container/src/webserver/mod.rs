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
use crate::models::{User, Farm, Field, Event, FarmRecord};

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
    let users = state.users.read().await;
    Ok(Json(users.clone()))
}
async fn create_user(State(state): State<AppState>, Json(user): Json<User>) -> Result<Json<User>, MyError> {
    state.users.write().await.push(user.clone());
    Ok(Json(user))
}

async fn list_farms(State(state): State<AppState>) -> Result<Json<Vec<Farm>>, MyError> {
    let farms = state.farms.read().await;
    Ok(Json(farms.clone()))
}
async fn create_farm(State(state): State<AppState>, Json(farm): Json<Farm>) -> Result<Json<Farm>, MyError> {
    state.farms.write().await.push(farm.clone());
    Ok(Json(farm))
}
async fn delete_farm(State(state): State<AppState>, Path(id): Path<u64>) -> Result<StatusCode, MyError> {
    let mut farms = state.farms.write().await;
    farms.retain(|f| f.id != id);
    Ok(StatusCode::NO_CONTENT)
}

async fn list_fields(State(state): State<AppState>) -> Result<Json<Vec<Field>>, MyError> {
    let fields = state.fields.read().await;
    Ok(Json(fields.clone()))
}
async fn create_field(State(state): State<AppState>, Json(field): Json<Field>) -> Result<Json<Field>, MyError> {
    state.fields.write().await.push(field.clone());
    Ok(Json(field))
}
async fn delete_field(State(state): State<AppState>, Path(id): Path<u64>) -> Result<StatusCode, MyError> {
    let mut fields = state.fields.write().await;
    fields.retain(|f| f.id != id);
    Ok(StatusCode::NO_CONTENT)
}

async fn list_events(State(state): State<AppState>) -> Result<Json<Vec<Event>>, MyError> {
    let events = state.events.read().await;
    Ok(Json(events.clone()))
}
async fn create_event(State(state): State<AppState>, Json(event): Json<Event>) -> Result<Json<Event>, MyError> {
    state.events.write().await.push(event.clone());
    Ok(Json(event))
}

async fn list_farm_records(State(state): State<AppState>) -> Result<Json<Vec<FarmRecord>>, MyError> {
    let records = state.farm_records.read().await;
    Ok(Json(records.clone()))
}
async fn create_farm_record(State(state): State<AppState>, Json(record): Json<FarmRecord>) -> Result<Json<FarmRecord>, MyError> {
    state.farm_records.write().await.push(record.clone());
    Ok(Json(record))
}

#[cfg(test)]
mod tests;
