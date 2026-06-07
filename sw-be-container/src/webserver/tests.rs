use crate::config::AppConfig;
use crate::state::AppState;
use crate::webserver::app_router;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum_prometheus::metrics_exporter_prometheus::PrometheusBuilder;
use http_body_util::BodyExt;
use std::sync::OnceLock;
use tower::ServiceExt;

use crate::tokio_tools::ThreadRuntime;
use url::Url;

/// Install the Prometheus recorder exactly once across all tests in this module.
static PROMETHEUS_HANDLE: OnceLock<axum_prometheus::metrics_exporter_prometheus::PrometheusHandle> =
    OnceLock::new();

fn init_prometheus() -> axum_prometheus::metrics_exporter_prometheus::PrometheusHandle {
    PROMETHEUS_HANDLE
        .get_or_init(|| PrometheusBuilder::new().install_recorder().unwrap())
        .clone()
}

fn get_test_state() -> AppState {
    let metric_handle = init_prometheus();
    let config = AppConfig {
        database: crate::config::DatabaseConfig {
            url: crate::config::UrlWithUsernamePassword {
                url: Url::parse("postgres://localhost:5432/db").unwrap(),
                username: None,
                password: None,
            },
            max_connections: 10,
        },
        webservice: crate::config::WebServiceConfig {
            address: Url::parse("http://0.0.0.0:8080").unwrap(),
            forwarding_headers: vec![],
            cors: crate::config::CorsConfig {
                allow_origins: vec![],
                allow_methods: vec![],
                allow_headers: vec![],
            },
            timeout: std::time::Duration::from_secs(30),
            max_connections: 100,
        },
        hams: ::hams::hams::config::HamsConfig::default(),
        runtime: ThreadRuntime {
            threads: 1,
            stack_size: 1024 * 1024,
            name: "test".to_string(),
        },
        startup_checks: crate::config::StartupCheckConfig {
            fails: 1,
            timeout: std::time::Duration::from_secs(1),
            enabled: false,
        },
        debugging: crate::config::DebuggingConfig::default(),
    };

    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(1))
        .connect_lazy("postgres://localhost:5432/db")
        .unwrap();

    AppState::new(config, metric_handle, db_pool)
}

#[tokio::test]
async fn test_app_router_hello() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/hello")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    assert_eq!(body_str, r#"{"message":"hello"}"#);
}

#[tokio::test]
async fn test_admin_health_unauthorized() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/admin/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // No header -> Default role "user" -> Forbidden
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_admin_health_authorized_support() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/admin/health")
                .header("X-User-Role", "support")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    assert!(body_str.contains(r#""admin":true"#));
}

#[tokio::test]
async fn test_admin_health_authorized_admin() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/admin/health")
                .header("X-User-Role", "admin")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

/// Test that the /v0/sync route exists and is reachable.
#[tokio::test]
async fn test_sync_route_exists() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/sync")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

/// Test that the /v0/sync route accepts a since query parameter.
#[tokio::test]
async fn test_sync_route_with_since_param() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/sync?since=2026-04-25T00:00:00Z")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::NOT_FOUND);
    assert_ne!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_cors_headers_present() {
    use tower_http::cors::CorsLayer;
    let mut state = get_test_state();
    state.config.webservice.cors.allow_origins = vec!["http://localhost:4200".to_string()];
    state.config.webservice.cors.allow_methods = vec!["GET".to_string(), "POST".to_string()];
    state.config.webservice.cors.allow_headers = vec!["content-type".to_string()];

    let origins: Vec<axum::http::HeaderValue> = state
        .config
        .webservice
        .cors
        .allow_origins
        .iter()
        .map(|o| o.parse().unwrap())
        .collect();
    let methods: Vec<axum::http::Method> = state
        .config
        .webservice
        .cors
        .allow_methods
        .iter()
        .map(|m| m.parse().unwrap())
        .collect();
    let headers: Vec<axum::http::header::HeaderName> = state
        .config
        .webservice
        .cors
        .allow_headers
        .iter()
        .map(|h| h.parse().unwrap())
        .collect();

    let cors_layer = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods(methods)
        .allow_headers(headers);
    let app = crate::webserver::app_router(state.clone()).layer(cors_layer);

    // Test preflight OPTIONS request
    let response = app
        .oneshot(
            Request::builder()
                .method("OPTIONS")
                .uri("/v0/hello")
                .header("Origin", "http://localhost:4200")
                .header("Access-Control-Request-Method", "GET")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let headers = response.headers();
    assert_eq!(
        headers.get("access-control-allow-origin").unwrap(),
        "http://localhost:4200"
    );
    let methods = headers
        .get("access-control-allow-methods")
        .unwrap()
        .to_str()
        .unwrap();
    assert!(methods.contains("GET"));
    assert!(methods.contains("POST"));
}

#[tokio::test]
async fn test_get_farm_route_exists() {
    let state = get_test_state();
    let app = app_router(state);

    let response = app
        .oneshot(
            Request::builder()
                .uri("/v0/farms/999")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    // The route should exist, so it should not return NOT_FOUND (404)
    // It might return INTERNAL_SERVER_ERROR (500) if database isn't fully mocked/accessible,
    // or NOT_FOUND if it queried the DB successfully but ID 999 doesn't exist.
    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_put_farm_route_exists() {
    let state = get_test_state();
    let app = app_router(state);

    let farm_json = serde_json::json!({
        "name": "Updated Farm Name",
        "location": "Updated Location"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/v0/farms/999")
                .header("Content-Type", "application/json")
                .body(Body::from(farm_json.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_put_field_route_exists() {
    let state = get_test_state();
    let app = app_router(state);

    let field_json = serde_json::json!({
        "farm_id": 1,
        "name": "Updated Field Name",
        "area_hectares": 12.5,
        "land_use": "arable"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/v0/fields/999")
                .header("Content-Type", "application/json")
                .body(Body::from(field_json.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_post_user_route_exists() {
    let state = get_test_state();
    let app = app_router(state);

    let user_json = serde_json::json!({
        "id": 0,
        "name": "Test User",
        "email": "test@example.com",
        "role": "admin",
        "phone": null,
        "description": null
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/v0/users")
                .header("Content-Type", "application/json")
                .body(Body::from(user_json.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_put_user_route_exists() {
    let state = get_test_state();
    let app = app_router(state);

    let user_json = serde_json::json!({
        "id": 999,
        "name": "Updated User",
        "email": "updated@example.com",
        "role": "support",
        "phone": "123456",
        "description": "Some description"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/v0/users/999")
                .header("Content-Type", "application/json")
                .body(Body::from(user_json.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}
