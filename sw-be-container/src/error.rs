//! Provide a custom error struct
//!
//! Allow derriving MyError from other Error types from dependant packages.

use std::io;

use ::hams::error::HamsError;
use axum::extract::rejection::JsonRejection;
use thiserror::Error;
use tracing_subscriber::filter::FromEnvError;

/// Error type for handling errors on Sample
#[derive(Error, Debug)]
pub enum MyError {
    #[error("General error `{0}`")]
    Message(String),
    #[error("Bad Request `{0}`")]
    BadRequest(String),
    #[error("Service Cancelled")]
    Cancelled,

    #[error("HaMs error `{0}`")]
    HamsError(#[from] HamsError),

    #[error("Prometheus error `{0}`")]
    PrometheusError(#[from] prometheus::Error),

    #[error("Serdes error `{0}`")]
    Serde(#[from] serde_json::Error),
    #[error("data store disconnected")]
    Io(#[from] io::Error),

    #[error("Json Rejection `{0}`")]
    JsonRejection(#[from] JsonRejection),

    #[error("Shutdown error")]
    ShutdownCheck,

    #[error("PreFlight error")]
    PreflightCheck,

    #[error("Figment error `{0}`")]
    FigmentError(#[from] figment::error::Error),

    #[error("EnvFilter error `{0}`")]
    EnvFilterError(#[from] FromEnvError),

    #[error("Not Found: `{0}`")]
    NotFound(String),

    #[error("Schema Mismatch: expected {expected}, actual {actual}")]
    SchemaMismatch { expected: i32, actual: i32 },

    #[error("Invalid header value")]
    InvalidHeaderValue(#[from] reqwest::header::InvalidHeaderValue),

    #[error("Database error")]
    DatabaseError(#[from] sqlx::Error),
}

impl axum::response::IntoResponse for MyError {
    fn into_response(self) -> axum::response::Response {
        #[derive(serde::Serialize)]
        struct ErrorResponse {
            message: String,
        }

        let (status, message) = match self {
            MyError::Message(msg) => (reqwest::StatusCode::INTERNAL_SERVER_ERROR, msg.to_string()),
            MyError::BadRequest(msg) => (reqwest::StatusCode::BAD_REQUEST, msg.to_string()),
            MyError::NotFound(msg) => (reqwest::StatusCode::NOT_FOUND, msg.to_string()),
            MyError::SchemaMismatch { .. } => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "Schema Mismatch".to_string(),
            ),
            MyError::Cancelled => (reqwest::StatusCode::INTERNAL_SERVER_ERROR, "Cancelled".to_string()),
            MyError::HamsError(_error) => {
                (reqwest::StatusCode::INTERNAL_SERVER_ERROR, "Hams Error".to_string())
            }
            MyError::Serde(_error) => (reqwest::StatusCode::BAD_REQUEST, "Serde Error".to_string()),
            MyError::Io(_error) => (reqwest::StatusCode::INTERNAL_SERVER_ERROR, "IO Error".to_string()),
            MyError::ShutdownCheck => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "Shutdown Check Failed".to_string(),
            ),
            MyError::PreflightCheck => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "Preflight Check Failed".to_string(),
            ),
            MyError::FigmentError(_error) => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "Config Error".to_string(),
            ),
            MyError::JsonRejection(rejection) => (rejection.status(), rejection.body_text()),
            MyError::PrometheusError(_error) => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "Prometheus Error".to_string(),
            ),
            MyError::EnvFilterError(_error) => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "EnvFilter Error".to_string(),
            ),
            MyError::InvalidHeaderValue(_error) => (
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "Invalid Header Value".to_string(),
            ),
            MyError::DatabaseError(error) => {
                tracing::error!("Database error: {}", error);
                (
                    reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                    "Database Error".to_string(),
                )
            },
        };

        (status, axum::Json(ErrorResponse { message })).into_response()
    }
}
