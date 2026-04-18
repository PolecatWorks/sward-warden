use axum::{routing::get, Router};

pub fn app_router() -> Router {
    Router::new().route("/", get(|| async { "Hello, World!" }))
}

pub fn health_router() -> Router {
    Router::new()
        .route("/liveness", get(|| async { "OK" }))
        .route("/readiness", get(|| async { "OK" }))
        .route("/startup", get(|| async { "OK" }))
        .route("/shutdown", get(|| async { "OK" }))
        .route("/health", get(|| async { "OK" }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_app_router() {
        let app = app_router();

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_health_router_liveness() {
        let app = health_router();

        let response = app
            .oneshot(Request::builder().uri("/liveness").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_health_router_readiness() {
        let app = health_router();

        let response = app
            .oneshot(Request::builder().uri("/readiness").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
