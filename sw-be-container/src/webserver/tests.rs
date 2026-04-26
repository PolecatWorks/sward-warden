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
