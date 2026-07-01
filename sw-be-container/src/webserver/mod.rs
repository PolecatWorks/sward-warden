pub mod admin;
pub mod applications;
pub mod auth;
pub mod compliance;
pub mod dev_auth;
pub mod events;
pub mod farms;
pub mod fields;
pub mod inventory;
pub mod movements;
pub mod optimization;
pub mod spatial;
pub mod sync;
pub mod users;
pub mod weather;

use axum::{
    Json, Router,
    routing::{delete, get, put},
};
use axum_prometheus::PrometheusMetricLayer;
use tokio_util::sync::CancellationToken;
use tower_http::{
    cors::CorsLayer,
    trace::{DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::{Level, info};

use crate::error::AppError;
use crate::state::AppState;

// PRD Reference: 0001
pub async fn hello_handler() -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(serde_json::json!({ "message": "hello" })))
}

// PRD Reference: 0001
// Central API Router
pub fn app_router(state: AppState) -> Router {
    let mut router = Router::new()
        .route("/v0/admin/health", get(admin::admin_health))
        .route("/v0/admin/farms", get(admin::admin_list_farms))
        .route("/v0/admin/fields", get(admin::admin_list_fields))
        .route("/v0/admin/events", get(admin::admin_list_events))
        .route("/v0/admin/audit-logs", get(admin::admin_list_audit_logs))
        .route("/v0/hello", get(hello_handler))
        .route("/v0/users", get(users::list_users).post(users::create_user))
        .route(
            "/v0/users/{id}",
            get(users::get_user)
                .put(users::update_user)
                .delete(users::delete_user),
        )
        .route("/v0/farms", get(farms::list_farms).post(farms::create_farm))
        .route(
            "/v0/farms/{id}",
            get(farms::get_farm)
                .put(farms::update_farm)
                .delete(farms::delete_farm),
        )
        .route(
            "/v0/farms/{farm_id}/soil-analyses",
            get(events::list_soil_analyses),
        )
        .route(
            "/v0/fields",
            get(fields::list_fields).post(fields::create_field),
        )
        .route(
            "/v0/fields/{id}",
            get(fields::get_field)
                .delete(fields::delete_field)
                .put(fields::update_field),
        )
        .route(
            "/v0/events",
            get(events::list_events).post(events::create_event),
        )
        .route("/v0/events/{id}", delete(events::delete_event))
        .route(
            "/v0/fertiliser-applications",
            get(applications::list_fertiliser_applications)
                .post(applications::create_fertiliser_application),
        )
        .route(
            "/v0/organic-manure-applications",
            get(applications::list_organic_manure_applications)
                .post(applications::create_organic_manure_application),
        )
        .route(
            "/v0/organic_manure_applications",
            get(applications::list_organic_manure_applications)
                .post(applications::create_organic_manure_application),
        )
        .route(
            "/v0/compliance-breaches",
            get(compliance::list_compliance_breaches).post(compliance::create_compliance_breach),
        )
        .route(
            "/v0/sward-movements",
            get(movements::list_sward_movements).post(movements::create_sward_movement),
        )
        .route(
            "/v0/optimization/suggestions/{farm_id}",
            get(optimization::get_farm_suggestions),
        )
        .route("/v0/weather/forecast", get(weather::get_forecast))
        .route(
            "/v0/spatial/waterway-buffers",
            get(spatial::get_waterway_buffers),
        )
        .route("/v0/sync/delta", get(sync::delta_sync))
        .route(
            "/v0/soil_analyses",
            get(events::list_soil_analyses).post(events::create_soil_analysis),
        )
        .route(
            "/v0/soil_analyses/{id}",
            delete(events::delete_soil_analysis),
        )
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
            get(applications::list_fertiliser_applications)
                .post(applications::create_fertiliser_application),
        )
        .route("/v0/sync", get(sync::delta_sync))
        .route(
            "/v0/inventory-storage",
            get(inventory::list_inventory_storage).post(inventory::create_inventory_storage),
        )
        .route(
            "/v0/inventory-storage/{id}",
            put(inventory::update_inventory_storage).delete(inventory::delete_inventory_storage),
        );

    if state.config.debugging.enable_dev_auth {
        router = router
            .route(
                "/dev/auth/token",
                axum::routing::post(dev_auth::generate_token),
            )
            .route("/.well-known/jwks.json", get(dev_auth::get_jwks));
    }

    router.with_state(state)
}

// PRD Reference: 0001
pub async fn start_app_api(state: AppState, ct: CancellationToken) -> Result<(), AppError> {
    let mut cors_layer = CorsLayer::new();

    let origins: Vec<axum::http::HeaderValue> = state
        .config
        .webservice
        .cors
        .allow_origins
        .iter()
        .map(|o| {
            o.parse()
                .map_err(|e| AppError::Message(format!("Invalid CORS origin in config: {e}")))
        })
        .collect::<Result<Vec<_>, _>>()?;
    cors_layer = cors_layer.allow_origin(origins);

    let methods: Vec<axum::http::Method> = state
        .config
        .webservice
        .cors
        .allow_methods
        .iter()
        .map(|m| {
            m.parse()
                .map_err(|e| AppError::Message(format!("Invalid CORS method in config: {e}")))
        })
        .collect::<Result<Vec<_>, _>>()?;
    cors_layer = cors_layer.allow_methods(methods);

    let headers: Vec<axum::http::header::HeaderName> = state
        .config
        .webservice
        .cors
        .allow_headers
        .iter()
        .map(|h| {
            h.parse()
                .map_err(|e| AppError::Message(format!("Invalid CORS header in config: {e}")))
        })
        .collect::<Result<Vec<_>, _>>()?;
    cors_layer = cors_layer.allow_headers(headers);

    let metric_layer = PrometheusMetricLayer::new();
    let api_router = app_router(state.clone());
    let prefix = state.config.webservice.address.path();

    let app = if prefix.is_empty() || prefix == "/" {
        api_router
    } else {
        let prefix = prefix.trim_end_matches('/');
        Router::new().nest(prefix, api_router)
    };

    let app = app
        .route("/hello", get(hello_handler))
        .layer(
            TraceLayer::new_for_http()
                .on_request(DefaultOnRequest::new().level(Level::DEBUG))
                .on_response(DefaultOnResponse::new().level(Level::DEBUG))
                .on_failure(DefaultOnFailure::new().level(Level::ERROR)),
        )
        .layer(cors_layer)
        .layer(metric_layer)
        .layer(tower_http::timeout::TimeoutLayer::with_status_code(
            axum::http::StatusCode::REQUEST_TIMEOUT,
            state.config.webservice.timeout,
        ))
        .layer(tower::limit::GlobalConcurrencyLimitLayer::new(
            state.config.webservice.max_connections,
        ));

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
