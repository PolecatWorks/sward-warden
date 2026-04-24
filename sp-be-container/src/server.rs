use crate::models::{Event, Farm, Field, User, FarmRecord};
use axum::{routing::{get, post}, Json, Router, extract::State};
use serde::Serialize;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Serialize)]
pub struct HelloResponse {
    pub message: String,
}

#[derive(Clone)]
pub struct AppState {
    pub users: Arc<RwLock<Vec<User>>>,
    pub farms: Arc<RwLock<Vec<Farm>>>,
    pub fields: Arc<RwLock<Vec<Field>>>,
    pub events: Arc<RwLock<Vec<Event>>>,
    pub farm_records: Arc<RwLock<Vec<FarmRecord>>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            users: Arc::new(RwLock::new(vec![User { id: 1, name: "John Doe".to_string(), email: "john@example.com".to_string() }])),
            farms: Arc::new(RwLock::new(vec![Farm { id: 1, user_id: 1, name: "Green Acres".to_string(), location: "Springfield".to_string() }])),
            fields: Arc::new(RwLock::new(vec![Field { id: 1, farm_id: 1, name: "North Field".to_string(), area_hectares: 10.5 }])),
            events: Arc::new(RwLock::new(vec![Event { id: 1, field_id: 1, event_type: "Slurry".to_string(), description: "Spring application".to_string(), date: "2024-04-01".to_string() }])),
            farm_records: Arc::new(RwLock::new(vec![FarmRecord { id: 1, farm_id: 1, agricultural_area: 100.0, manure_storage_capacity: 500.0, year: 2024 }])),
        }
    }
}

pub fn app_router() -> Router {
    let state = AppState::default();

    Router::new()
        .route("/v0/hello", get(|| async {
            Json(HelloResponse { message: "hello".to_string() })
        }))
        .route("/v0/users", get(|State(state): State<AppState>| async move {
            let users = state.users.read().await;
            Json(users.clone())
        })
        .post(|State(state): State<AppState>, Json(user): Json<User>| async move {
            state.users.write().await.push(user.clone());
            Json(user)
        }))
        .route("/v0/farms", get(|State(state): State<AppState>| async move {
            let farms = state.farms.read().await;
            Json(farms.clone())
        })
        .post(|State(state): State<AppState>, Json(farm): Json<Farm>| async move {
            state.farms.write().await.push(farm.clone());
            Json(farm)
        }))
        .route("/v0/farms/{id}", axum::routing::delete(|State(state): State<AppState>, axum::extract::Path(id): axum::extract::Path<u64>| async move {
            let mut farms = state.farms.write().await;
            farms.retain(|f| f.id != id);
            axum::http::StatusCode::NO_CONTENT
        }))
        .route("/v0/fields", get(|State(state): State<AppState>| async move {
            let fields = state.fields.read().await;
            Json(fields.clone())
        })
        .post(|State(state): State<AppState>, Json(field): Json<Field>| async move {
            state.fields.write().await.push(field.clone());
            Json(field)
        }))
        .route("/v0/fields/{id}", axum::routing::delete(|State(state): State<AppState>, axum::extract::Path(id): axum::extract::Path<u64>| async move {
            let mut fields = state.fields.write().await;
            fields.retain(|f| f.id != id);
            axum::http::StatusCode::NO_CONTENT
        }))
        .route("/v0/events", get(|State(state): State<AppState>| async move {
            let events = state.events.read().await;
            Json(events.clone())
        })
        .post(|State(state): State<AppState>, Json(event): Json<Event>| async move {
            state.events.write().await.push(event.clone());
            Json(event)
        }))
        .route("/v0/farm_records", get(|State(state): State<AppState>| async move {
            let farm_records = state.farm_records.read().await;
            Json(farm_records.clone())
        })
        .post(|State(state): State<AppState>, Json(farm_record): Json<FarmRecord>| async move {
            state.farm_records.write().await.push(farm_record.clone());
            Json(farm_record)
        }))
        .with_state(state)
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

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/users").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("John Doe"));

        let new_user = User { id: 2, name: "Jane Doe".to_string(), email: "jane@example.com".to_string() };
        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v0/users")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&new_user).unwrap()))
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Jane Doe"));

        let response = app
            .oneshot(Request::builder().uri("/v0/users").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Jane Doe"));
    }

    #[tokio::test]
    async fn test_app_router_farms() {
        let app = app_router();

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/farms").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Green Acres"));

        let new_farm = Farm { id: 2, user_id: 2, name: "Red Barn".to_string(), location: "Shelbyville".to_string() };
        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v0/farms")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&new_farm).unwrap()))
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Red Barn"));

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/farms").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Red Barn"));

        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/v0/farms/1")
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NO_CONTENT);

        let response = app
            .oneshot(Request::builder().uri("/v0/farms").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(!body_str.contains("Green Acres")); // Farm 1
    }

    #[tokio::test]
    async fn test_app_router_fields() {
        let app = app_router();

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/fields").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("North Field"));

        let new_field = Field { id: 2, farm_id: 2, name: "South Field".to_string(), area_hectares: 20.0 };
        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v0/fields")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&new_field).unwrap()))
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("South Field"));

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/fields").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("South Field"));

        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/v0/fields/1")
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NO_CONTENT);

        let response = app
            .oneshot(Request::builder().uri("/v0/fields").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(!body_str.contains("North Field")); // Field 1
    }

    #[tokio::test]
    async fn test_app_router_events() {
        let app = app_router();

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/events").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Spring application"));

        let new_event = Event { id: 2, field_id: 2, event_type: "Planting".to_string(), description: "Corn".to_string(), date: "2024-05-01".to_string() };
        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v0/events")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&new_event).unwrap()))
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Planting"));

        let response = app
            .oneshot(Request::builder().uri("/v0/events").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("Planting"));
    }

    #[tokio::test]
    async fn test_app_router_farm_records() {
        let app = app_router();

        let response = app.clone()
            .oneshot(Request::builder().uri("/v0/farm_records").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("100.0")); // from agricultural_area

        let new_record = FarmRecord { id: 2, farm_id: 2, agricultural_area: 250.5, manure_storage_capacity: 1000.0, year: 2025 };
        let response = app.clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/v0/farm_records")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&new_record).unwrap()))
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("250.5"));

        let response = app
            .oneshot(Request::builder().uri("/v0/farm_records").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let body_str = String::from_utf8(body.to_vec()).unwrap();
        assert!(body_str.contains("250.5"));
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
