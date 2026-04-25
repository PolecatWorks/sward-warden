use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;
use crate::webserver::app_router;
use crate::state::AppState;
use crate::config::AppConfig;
use axum_prometheus::metrics_exporter_prometheus::PrometheusBuilder;

use crate::tokio_tools::ThreadRuntime;
use url::Url;

async fn get_test_state() -> AppState {
    let metric_handle = PrometheusBuilder::new().install_recorder().unwrap();
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

    // We cannot easily test real DB without setting one up, but we can supply a dummy pool to test the hello route
    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .connect_lazy("postgres://localhost:5432/db")
        .unwrap();

    AppState::new(config, metric_handle, db_pool)
}

#[tokio::test]
async fn test_app_router_hello() {
    let state = get_test_state().await;
    let app = app_router(state);

    let response = app
        .oneshot(Request::builder().uri("/v0/hello").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    assert_eq!(body_str, r#"{"message":"hello"}"#);
}
