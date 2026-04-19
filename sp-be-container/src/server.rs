use crate::models::{Event, Farm, Field, User};
use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
pub struct HelloResponse {
    pub message: String,
}

pub fn app_router() -> Router {
    Router::new()
        .route("/v0/hello", get(|| async {
            Json(HelloResponse { message: "hello".to_string() })
        }))
        .route("/v0/users", get(|| async {
            Json(vec![
                User { id: 1, name: "John Doe".to_string(), email: "john@example.com".to_string() },
            ])
        }))
        .route("/v0/farms", get(|| async {
            Json(vec![
                Farm { id: 1, user_id: 1, name: "Green Acres".to_string(), location: "Springfield".to_string() },
            ])
        }))
        .route("/v0/fields", get(|| async {
            Json(vec![
                Field { id: 1, farm_id: 1, name: "North Field".to_string(), area_hectares: 10.5 },
            ])
        }))
        .route("/v0/events", get(|| async {
            Json(vec![
                Event { id: 1, field_id: 1, event_type: "Slurry".to_string(), description: "Spring application".to_string(), date: "2024-04-01".to_string() },
            ])
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
    async fn test_app_router_users() {
        let app = app_router();

        let response = app
            .oneshot(Request::builder().uri("/v0/users").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("John Doe"));
    }

    #[tokio::test]
    async fn test_app_router_farms() {
        let app = app_router();

        let response = app
            .oneshot(Request::builder().uri("/v0/farms").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Green Acres"));
    }

    #[tokio::test]
    async fn test_app_router_fields() {
        let app = app_router();

        let response = app
            .oneshot(Request::builder().uri("/v0/fields").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("North Field"));
    }

    #[tokio::test]
    async fn test_app_router_events() {
        let app = app_router();

        let response = app
            .oneshot(Request::builder().uri("/v0/events").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Spring application"));
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
