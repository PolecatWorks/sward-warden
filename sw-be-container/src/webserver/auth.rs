use axum::{
    extract::FromRequestParts,
    http::request::Parts,
};
use crate::error::AppError;

pub struct AdminOnly;

impl<S> FromRequestParts<S> for AdminOnly
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let role_str = parts
            .headers
            .get("X-User-Role")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("user");

        if role_str == "admin" {
            Ok(AdminOnly)
        } else {
            Err(AppError::Forbidden("Admin role required".to_string()))
        }
    }
}

pub struct SupportOnly;

impl<S> FromRequestParts<S> for SupportOnly
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let role_str = parts
            .headers
            .get("X-User-Role")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("user");

        if role_str == "admin" || role_str == "support" {
            Ok(SupportOnly)
        } else {
            Err(AppError::Forbidden("Support or Admin role required".to_string()))
        }
    }
}
