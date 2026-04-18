use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
pub struct HelloResponse {
    pub message: String,
}

pub fn app_router() -> Router {
    Router::new().route("/v0/hello", get(|| async {
        Json(HelloResponse { message: "hello".to_string() })
    }))
}

pub fn health_router() -> Router {
    Router::new()
        .route("/hams/alive", get(|| async { "OK" }))
        .route("/hams/ready", get(|| async { "OK" }))
        .route("/hams/startup", get(|| async { "OK" }))
        .route("/hams/shutdown", get(|| async { "OK" }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_app_router_hello() {
        let app = app_router();

        let response = app
            .oneshot(Request::builder().uri("/v0/hello").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert_eq!(body_str, r#"{"message":"hello"}"#);
    }

    #[tokio::test]
    async fn test_health_router_alive() {
        let app = health_router();

        let response = app
            .oneshot(Request::builder().uri("/hams/alive").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_health_router_ready() {
        let app = health_router();

        let response = app
            .oneshot(Request::builder().uri("/hams/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
