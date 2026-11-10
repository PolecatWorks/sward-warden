//! Authentication extractors and RBAC permission guards for Axum routes.
//!
//! Handles JWT verification, dev-auth mode fallbacks, account suspension checks,
//! and extraction of `UserId`, `AdminOnly`, and `SupportOnly` guards.

use crate::error::AppError;
use crate::state::AppState;
use axum::{extract::FromRequestParts, http::request::Parts};
use jwt_simple::prelude::*;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Single key representation within a JWKS JSON response.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct JwkKey {
    pub kid: Option<String>,
    pub kty: String,
    pub alg: Option<String>,
    pub n: Option<String>,
    pub e: Option<String>,
}

/// Root JWKS response payload.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct JwksResponse {
    pub keys: Vec<JwkKey>,
}

/// Token payload claims extracted from verified JWTs.
#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct VerifiedClaims {
    #[serde(default)]
    pub sward_roles: Vec<String>,
    #[serde(default)]
    pub realm_access: Option<RealmAccessClaims>,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct RealmAccessClaims {
    #[serde(default)]
    pub roles: Vec<String>,
}

/// Thread-safe in-memory cache of verified public keys with automatic TTL expiration.
pub struct JwksVerifier {
    keys: RwLock<HashMap<String, (RS256PublicKey, Instant)>>,
    cache_ttl: Duration,
    http_client: reqwest::Client,
}

impl Default for JwksVerifier {
    fn default() -> Self {
        Self::new()
    }
}

impl JwksVerifier {
    pub fn new() -> Self {
        Self {
            keys: RwLock::new(HashMap::new()),
            cache_ttl: Duration::from_secs(3600),
            http_client: reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .unwrap_or_else(|_| reqwest::Client::new()),
        }
    }

    /// Explicitly register or seed a public key in the cache (useful for dev-mode or tests).
    pub async fn add_key(&self, kid: String, public_key: RS256PublicKey) {
        let mut write_guard = self.keys.write().await;
        write_guard.insert(kid, (public_key, Instant::now()));
    }

    /// Synchronously register or seed a public key without async await.
    pub fn add_key_sync(&self, kid: String, public_key: RS256PublicKey) {
        if let Ok(mut write_guard) = self.keys.try_write() {
            write_guard.insert(kid, (public_key, Instant::now()));
        } else {
            let mut write_guard = self.keys.blocking_write();
            write_guard.insert(kid, (public_key, Instant::now()));
        }
    }

    /// Retrieve or refresh the matching public key for a key ID.
    pub async fn get_key(
        &self,
        kid: &str,
        jwks_url: Option<&str>,
        force_refresh: bool,
    ) -> Result<RS256PublicKey, AppError> {
        let now = Instant::now();

        if !force_refresh {
            let read_guard = self.keys.read().await;
            if let Some((key, inserted_at)) = read_guard.get(kid) {
                if now.duration_since(*inserted_at) < self.cache_ttl {
                    return Ok(key.clone());
                }
            }
        }

        let url = jwks_url.ok_or_else(|| {
            AppError::Unauthorized(format!("Key '{kid}' not found and no JWKS URL configured"))
        })?;

        self.refresh_keys(url).await?;

        let read_guard = self.keys.read().await;
        read_guard
            .get(kid)
            .map(|(k, _)| k.clone())
            .ok_or_else(|| AppError::Unauthorized(format!("Key ID '{kid}' not found in JWKS")))
    }

    /// Fetch keys from the JWKS URL and update the cache.
    pub async fn refresh_keys(&self, jwks_url: &str) -> Result<(), AppError> {
        use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};

        let res = self.http_client.get(jwks_url).send().await.map_err(|e| {
            AppError::Unauthorized(format!("Failed to fetch JWKS from {jwks_url}: {e}"))
        })?;

        let jwks: JwksResponse = res
            .json()
            .await
            .map_err(|e| AppError::Unauthorized(format!("Failed to parse JWKS JSON: {e}")))?;

        let mut write_guard = self.keys.write().await;
        let now = Instant::now();

        for key_data in jwks.keys {
            if key_data.kty == "RSA"
                && let (Some(n_str), Some(e_str)) = (key_data.n, key_data.e)
            {
                let n_bytes = match URL_SAFE_NO_PAD.decode(&n_str) {
                    Ok(b) => b,
                    Err(_) => continue,
                };
                let e_bytes = match URL_SAFE_NO_PAD.decode(&e_str) {
                    Ok(b) => b,
                    Err(_) => continue,
                };

                if let Ok(mut pk) = RS256PublicKey::from_components(&n_bytes, &e_bytes) {
                    if let Some(ref kid) = key_data.kid {
                        pk.set_key_id(kid.clone());
                        write_guard.insert(kid.clone(), (pk, now));
                    }
                }
            }
        }

        Ok(())
    }
}

/// Axum extractor guard requiring `admin` role privileges.
pub struct AdminOnly;

impl FromRequestParts<AppState> for AdminOnly {
    type Rejection = AppError;

    // References more than 3 PRDs
    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let (sub, mut role) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info_by_sub(&state.db_pool, &sub).await;

        if let Some((_, true, _)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        if role.is_none() {
            role = auth_info.map(|(r, _, _)| r);
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
        let (sub, mut role) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info_by_sub(&state.db_pool, &sub).await;

        if let Some((_, true, _)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        if role.is_none() {
            role = auth_info.map(|(r, _, _)| r);
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
        let (sub, _) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info_by_sub(&state.db_pool, &sub).await;
        if let Some((_, true, _)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        let user_id = if let Ok(id) = sub.parse::<i64>() {
            id
        } else if let Some((_, _, Some(id))) = auth_info {
            id
        } else {
            return Err(AppError::Unauthorized("User not found".to_string()));
        };

        Ok(UserId(user_id))
    }
}

pub struct JwtUser {
    pub sub: String,
    pub user_id: Option<i64>,
    pub role: String,
}

impl FromRequestParts<AppState> for JwtUser {
    type Rejection = AppError;

    // References more than 3 PRDs
    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let (sub, role) = extract_jwt_claims(parts, state).await?;

        let auth_info = get_user_auth_info_by_sub(&state.db_pool, &sub).await;
        if let Some((_, true, _)) = auth_info {
            return Err(AppError::Forbidden("Account is suspended".to_string()));
        }

        let user_id = if let Ok(id) = sub.parse::<i64>() {
            Some(id)
        } else {
            auth_info.as_ref().and_then(|(_, _, id)| *id)
        };

        let role_str = role
            .or_else(|| auth_info.map(|(r, _, _)| r))
            .unwrap_or_else(|| "user".to_string());

        Ok(JwtUser {
            sub,
            user_id,
            role: role_str,
        })
    }
}

pub struct OptionalJwtUser(pub Option<JwtUser>);

impl FromRequestParts<AppState> for OptionalJwtUser {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let user = JwtUser::from_request_parts(parts, state).await.ok();
        Ok(OptionalJwtUser(user))
    }
}

#[derive(Debug, Clone)]
pub struct RawToken(pub String);

// PRD Reference: 0001, 0014
async fn extract_jwt_claims(
    parts: &mut Parts,
    state: &AppState,
) -> Result<(String, Option<String>), AppError> {
    let auth_header = parts
        .headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid Authorization header format".to_string()))?;

    parts.extensions.insert(RawToken(token.to_string()));

    let jwks_url = state.config.auth.jwks_url.as_deref();

    let mut verification_options = VerificationOptions::default();

    let expected_aud = state.config.auth.audience.as_deref().unwrap_or("sward-api");
    verification_options.allowed_audiences =
        Some(std::collections::HashSet::from([expected_aud.to_string()]));

    let expected_iss = state
        .config
        .auth
        .issuer
        .as_deref()
        .unwrap_or("http://localhost:8080");
    verification_options.allowed_issuers =
        Some(std::collections::HashSet::from([expected_iss.to_string()]));

    // Read header to extract Key ID (kid)
    let token_metadata = Token::decode_metadata(token)
        .map_err(|e| AppError::Unauthorized(format!("Invalid JWT header metadata: {e}")))?;

    let kid = token_metadata
        .key_id()
        .ok_or_else(|| AppError::Unauthorized("JWT missing 'kid' header parameter".to_string()))?;

    let public_key = state.jwks_verifier.get_key(kid, jwks_url, false).await?;

    let claims = public_key
        .verify_token::<VerifiedClaims>(token, Some(verification_options))
        .map_err(|e| AppError::Unauthorized(format!("Invalid token signature or claims: {e}")))?;

    let user_id_str = claims
        .subject
        .ok_or_else(|| AppError::Unauthorized("Missing subject claim in token".to_string()))?;

    let role = claims.custom.sward_roles.first().cloned().or_else(|| {
        claims
            .custom
            .realm_access
            .and_then(|r| r.roles.first().cloned())
    });

    Ok((user_id_str, role))
}

pub async fn get_user_auth_info_by_sub(
    pool: &sqlx::PgPool,
    sub: &str,
) -> Option<(String, bool, Option<i64>)> {
    if let Ok(id) = sub.parse::<i64>() {
        sqlx::query_as::<_, (String, bool, i64)>(
            "SELECT role::text, is_suspended, id FROM users WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .map(|(role, suspended, id)| (role, suspended, Some(id)))
    } else {
        let res = sqlx::query_as::<_, (String, bool, i64)>(
            "SELECT role::text, is_suspended, id FROM users WHERE keycloak_sub = $1",
        )
        .bind(sub)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();

        if res.is_some() {
            return res.map(|(role, suspended, id)| (role, suspended, Some(id)));
        }
        None
    }
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
