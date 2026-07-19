use crate::error::AppError;
use crate::state::AppState;
use crate::webserver::dev_auth::CustomClaims;
use axum::{extract::FromRequestParts, http::request::Parts};
use jwt_simple::prelude::*;

pub struct AdminOnly;

impl FromRequestParts<AppState> for AdminOnly {
    type Rejection = AppError;

    // References more than 3 PRDs
    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let (user_id, mut role) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info(&state.db_pool, user_id).await;

        if let Some((_, true)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        if role.is_none() {
            role = auth_info.map(|(r, _)| r);
        }

        let role_str = role.unwrap_or_else(|| "user".to_string());

        if role_str == "admin" {
            Ok(AdminOnly)
        } else {
            Err(AppError::Forbidden("Admin role required".to_string()))
        }
    }
}

pub struct SupportOnly;

impl FromRequestParts<AppState> for SupportOnly {
    type Rejection = AppError;

    // References more than 3 PRDs
    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let (user_id, mut role) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info(&state.db_pool, user_id).await;

        if let Some((_, true)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        if role.is_none() {
            role = auth_info.map(|(r, _)| r);
        }

        let role_str = role.unwrap_or_else(|| "user".to_string());

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

impl FromRequestParts<AppState> for UserId {
    type Rejection = AppError;

    // References more than 3 PRDs
    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let (user_id, _) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info(&state.db_pool, user_id).await;
        if let Some((_, true)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        Ok(UserId(user_id))
    }
}

pub struct JwtUser {
    pub user_id: i64,
    pub role: String,
}

impl FromRequestParts<AppState> for JwtUser {
    type Rejection = AppError;

    // References more than 3 PRDs
    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let (user_id, role) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info(&state.db_pool, user_id).await;
        if let Some((_, true)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        let role_str = role.unwrap_or_else(|| "user".to_string());
        Ok(JwtUser {
            user_id,
            role: role_str,
        })
    }
}

#[derive(Debug, Clone)]
pub struct RawToken(pub String);

#[derive(Debug, Clone, serde::Deserialize)]
pub struct JwtPayload {
    pub sub: String,
    #[serde(default)]
    pub sward_roles: Vec<String>,
}

fn decode_base64(s: &str) -> Result<Vec<u8>, AppError> {
    use base64::{
        Engine as _,
        engine::general_purpose::{STANDARD, STANDARD_NO_PAD, URL_SAFE, URL_SAFE_NO_PAD},
    };
    STANDARD
        .decode(s)
        .or_else(|_| STANDARD_NO_PAD.decode(s))
        .or_else(|_| URL_SAFE.decode(s))
        .or_else(|_| URL_SAFE_NO_PAD.decode(s))
        .map_err(|e| AppError::Unauthorized(format!("Failed to decode base64 x-jwt-payload: {e}")))
}

// PRD Reference: 0001, 0014
async fn extract_jwt_claims(
    parts: &mut Parts,
    state: &AppState,
) -> Result<(i64, Option<String>), AppError> {
    // Retain the raw token if Authorization header is present
    if let Some(auth_header) = parts
        .headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
    {
        if auth_header.starts_with("Bearer ") {
            let token = &auth_header["Bearer ".len()..];
            parts.extensions.insert(RawToken(token.to_string()));
        }
    }

    if let Some(jwt_payload_header) = parts.headers.get("x-jwt-payload") {
        let payload_str = jwt_payload_header.to_str().map_err(|_| {
            AppError::Unauthorized("Invalid x-jwt-payload header format".to_string())
        })?;

        let decoded_bytes = decode_base64(payload_str)?;
        let decoded_str = String::from_utf8(decoded_bytes).map_err(|e| {
            AppError::Unauthorized(format!("Invalid UTF-8 in decoded x-jwt-payload: {e}"))
        })?;

        let payload: JwtPayload = serde_json::from_str(&decoded_str).map_err(|e| {
            AppError::Unauthorized(format!("Failed to parse x-jwt-payload JSON: {e}"))
        })?;

        let user_id = payload.sub.parse::<i64>().map_err(|_| {
            AppError::Unauthorized("Invalid subject claim format in x-jwt-payload".to_string())
        })?;

        let role = payload.sward_roles.first().cloned();
        return Ok((user_id, role));
    }

    if !state.config.debugging.enable_dev_auth {
        return Err(AppError::Unauthorized(
            "Missing x-jwt-payload header".to_string(),
        ));
    }

    let auth_header = parts
        .headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized(
            "Invalid Authorization header format".to_string(),
        ));
    }

    let token = &auth_header["Bearer ".len()..];

    let public_key = if let Some(keypair) = &state.dev_jwt_keypair {
        keypair.public_key()
    } else {
        return Err(AppError::Unauthorized(
            "Dev auth is not enabled, missing public key".to_string(),
        ));
    };

    let mut verification_options = VerificationOptions::default();
    verification_options.allowed_audiences =
        Some(std::collections::HashSet::from(["sward-api".to_string()]));
    verification_options.allowed_issuers = Some(std::collections::HashSet::from([
        "http://localhost:8080".to_string(),
    ]));

    let claims = public_key
        .verify_token::<CustomClaims>(token, Some(verification_options))
        .map_err(|e| AppError::Unauthorized(format!("Invalid token: {e}")))?;

    let user_id_str = claims
        .subject
        .ok_or_else(|| AppError::Unauthorized("Missing subject claim".to_string()))?;
    let user_id = user_id_str
        .parse::<i64>()
        .map_err(|_| AppError::Unauthorized("Invalid subject claim format".to_string()))?;

    let role = claims.custom.sward_roles.first().cloned();

    Ok((user_id, role))
}

pub async fn get_user_auth_info(pool: &sqlx::PgPool, user_id: i64) -> Option<(String, bool)> {
    sqlx::query_as::<_, (String, bool)>("SELECT role::text, is_suspended FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
}

// References more than 3 PRDs
pub async fn get_user_role(pool: &sqlx::PgPool, user_id: i64) -> Option<String> {
    get_user_auth_info(pool, user_id)
        .await
        .map(|(role, _)| role)
}

// PRD Reference: 0013
pub async fn check_is_admin(pool: &sqlx::PgPool, user_id: i64) -> bool {
    get_user_role(pool, user_id)
        .await
        .map(|role| role == "admin")
        .unwrap_or(false)
}
