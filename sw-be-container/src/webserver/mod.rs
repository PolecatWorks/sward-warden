pub mod auth;
pub mod users;
pub mod farms;
pub mod fields;
pub mod events;
pub mod sync;
pub mod compliance;
pub mod movements;
pub mod admin;
pub mod applications;

use axum::{
    Json, Router,
    routing::{delete, get},
};
use axum_prometheus::PrometheusMetricLayer;
use tokio_util::sync::CancellationToken;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::{Level, info};

use crate::error::AppError;
use crate::state::AppState;

// Central API Router
pub fn app_router(state: AppState) -> Router {
    Router::new()
        .route("/v0/admin/health", get(admin::admin_health))
        .route("/v0/admin/farms", get(admin::admin_list_farms))
        .route("/v0/admin/fields", get(admin::admin_list_fields))
        .route("/v0/admin/events", get(admin::admin_list_events))
        .route("/v0/admin/audit-logs", get(admin::admin_list_audit_logs))
        .route(
            "/v0/hello",
            get(|| async { Ok::<_, AppError>(Json(serde_json::json!({ "message": "hello" }))) }),
        )
        .route("/v0/users", get(users::list_users).post(users::create_user))
        .route("/v0/farms", get(farms::list_farms).post(farms::create_farm))
        .route("/v0/farms/{id}", delete(farms::delete_farm))
        .route("/v0/farms/{farm_id}/soil-analyses", get(events::list_soil_analyses))
        .route("/v0/fields", get(fields::list_fields).post(fields::create_field))
        .route("/v0/fields/{id}", delete(fields::delete_field))
        .route("/v0/events", get(events::list_events).post(events::create_event))
        .route(
            "/v0/fertiliser-applications",
            get(applications::list_fertiliser_applications).post(applications::create_fertiliser_application),
        )
        .route(
            "/v0/organic-manure-applications",
            get(applications::list_organic_manure_applications).post(applications::create_organic_manure_application),
        )
        .route(
            "/v0/compliance-breaches",
            get(compliance::list_compliance_breaches).post(compliance::create_compliance_breach),
        )
        .route(
            "/v0/sward-movements",
            get(movements::list_sward_movements).post(movements::create_sward_movement),
        )
        .route("/v0/sync/delta", get(sync::delta_sync))
        .route(
            "/v0/soil_analyses",
            get(events::list_soil_analyses).post(events::create_soil_analysis),
        )
        .route("/v0/soil_analyses/{id}", delete(events::delete_soil_analysis))
        .route(
            "/v0/fertilisation_plans",
            get(events::list_fertilisation_plans).post(events::create_fertilisation_plan),
        )
        .route(
            "/v0/fertilisation_plans/{id}",
            delete(events::delete_fertilisation_plan),
        )
        .route(
            "/v0/farm_records",
            get(events::list_farm_records).post(events::create_farm_record),
        )
        .route(
            "/v0/fertiliser_applications",
            get(applications::list_fertiliser_applications).post(applications::create_fertiliser_application),
        )
        .route("/v0/sync", get(sync::delta_sync))
        .with_state(state)
}

pub async fn start_app_api(state: AppState, ct: CancellationToken) -> Result<(), AppError> {
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

#[cfg(test)]
mod tests;
