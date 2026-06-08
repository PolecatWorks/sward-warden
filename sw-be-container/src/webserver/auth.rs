use crate::error::AppError;
use axum::{extract::FromRequestParts, http::request::Parts};

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
            Err(AppError::Forbidden(
                "Support or Admin role required".to_string(),
            ))
        }
    }
}

pub struct UserId(pub i64);

impl<S> FromRequestParts<S> for UserId
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let user_id_str = parts
            .headers
            .get("X-User-ID")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("1");

        let user_id = user_id_str
            .parse::<i64>()
            .map_err(|_| AppError::BadRequest("Invalid X-User-ID header".to_string()))?;

        Ok(UserId(user_id))
    }
}

pub async fn check_is_admin(pool: &sqlx::PgPool, user_id: i64) -> bool {
    sqlx::query_scalar::<_, String>("SELECT role FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .map(|role| role == "admin")
        .unwrap_or(false)
}
