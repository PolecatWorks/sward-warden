use crate::config::AppConfig;
use crate::error::AppError;
use std::collections::HashMap;
use tracing::{info, warn};

#[derive(serde::Deserialize)]
struct TokenResponse {
    access_token: String,
}

#[derive(serde::Deserialize)]
struct KeycloakUserSearch {
    id: String,
}

#[derive(serde::Serialize)]
struct UserRepresentation {
    #[serde(skip_serializing_if = "Option::is_none")]
    enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    attributes: Option<HashMap<String, Vec<String>>>,
}

pub async fn sync_user_to_keycloak(
    config: &AppConfig,
    raw_token: Option<&str>,
    email: &str,
    enabled: bool,
    is_suspended: bool,
    modules: &[String],
) -> Result<(), AppError> {
    let keycloak_config = &config.keycloak;

    let base_url = match &keycloak_config.base_url {
        Some(url) if !url.trim().is_empty() => url.trim().trim_end_matches('/'),
        _ => {
            if config.debugging.enable_dev_auth {
                warn!("Keycloak base_url is not configured, skipping admin sync in dev mode");
                return Ok(());
            } else {
                return Err(AppError::Message(
                    "Keycloak base_url is not configured".to_string(),
                ));
            }
        }
    };

    let realm = match &keycloak_config.realm {
        Some(r) if !r.trim().is_empty() => r.trim(),
        _ => "sw-dev",
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| AppError::Message(format!("Failed to build reqwest client: {e}")))?;

    // 1. Obtain access token
    let token = if let Some(t) = raw_token {
        t.to_string()
    } else if let (Some(client_id), Some(client_secret)) =
        (&keycloak_config.client_id, &keycloak_config.client_secret)
    {
        if client_id.trim().is_empty() || client_secret.trim().is_empty() {
            if config.debugging.enable_dev_auth {
                warn!("Keycloak credentials empty, skipping admin sync in dev mode");
                return Ok(());
            } else {
                return Err(AppError::Message(
                    "Keycloak client credentials are empty".to_string(),
                ));
            }
        }
        let token_url = format!("{base_url}/realms/{realm}/protocol/openid-connect/token");
        let body = url::form_urlencoded::Serializer::new(String::new())
            .append_pair("grant_type", "client_credentials")
            .append_pair("client_id", client_id)
            .append_pair("client_secret", client_secret)
            .finish();

        let res = match client
            .post(&token_url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(body)
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                if config.debugging.enable_dev_auth {
                    warn!("Failed to fetch Keycloak service account token (unreachable?): {e}");
                    return Ok(());
                } else {
                    return Err(AppError::Message(format!(
                        "Failed to fetch Keycloak token: {e}"
                    )));
                }
            }
        };

        if !res.status().is_success() {
            let status = res.status();
            let err_text = res.text().await.unwrap_or_default();
            return Err(AppError::Message(format!(
                "Keycloak token request failed with status {status}: {err_text}"
            )));
        }

        let token_res: TokenResponse = res.json().await.map_err(|e| {
            AppError::Message(format!("Failed to parse Keycloak token response: {e}"))
        })?;

        token_res.access_token
    } else {
        if config.debugging.enable_dev_auth {
            warn!("No credentials or raw token available, skipping keycloak sync in dev mode");
            return Ok(());
        } else {
            return Err(AppError::Message(
                "Neither raw token nor client credentials are configured for Keycloak sync"
                    .to_string(),
            ));
        }
    };

    // 2. Search for the user by email
    let search_url = format!("{base_url}/admin/realms/{realm}/users?email={email}");
    let search_res = match client.get(&search_url).bearer_auth(&token).send().await {
        Ok(r) => r,
        Err(e) => {
            if config.debugging.enable_dev_auth {
                warn!("Failed to search Keycloak user (unreachable?): {e}");
                return Ok(());
            } else {
                return Err(AppError::Message(format!(
                    "Failed to search Keycloak user: {e}"
                )));
            }
        }
    };

    if !search_res.status().is_success() {
        let status = search_res.status();
        let err_text = search_res.text().await.unwrap_or_default();
        return Err(AppError::Message(format!(
            "Keycloak search failed with status {status}: {err_text}"
        )));
    }

    let users: Vec<KeycloakUserSearch> = search_res.json().await.map_err(|e| {
        AppError::Message(format!(
            "Failed to parse Keycloak user search response: {e}"
        ))
    })?;

    let keycloak_user_id = match users.first() {
        Some(u) => &u.id,
        None => {
            if config.debugging.enable_dev_auth {
                warn!(
                    "User with email {} not found in Keycloak, skipping sync in dev mode",
                    email
                );
                return Ok(());
            } else {
                return Err(AppError::NotFound(format!(
                    "User not found in Keycloak: {email}"
                )));
            }
        }
    };

    // 3. Perform user representation update PUT request
    let update_url = format!("{base_url}/admin/realms/{realm}/users/{keycloak_user_id}");

    let mut attributes = HashMap::new();
    attributes.insert("is_suspended".to_string(), vec![is_suspended.to_string()]);
    attributes.insert("modules".to_string(), modules.to_vec());

    let payload = UserRepresentation {
        enabled: Some(enabled),
        attributes: Some(attributes),
    };

    let update_res = match client
        .put(&update_url)
        .bearer_auth(&token)
        .json(&payload)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            if config.debugging.enable_dev_auth {
                warn!("Failed to update Keycloak user (unreachable?): {e}");
                return Ok(());
            } else {
                return Err(AppError::Message(format!(
                    "Failed to update Keycloak user: {e}"
                )));
            }
        }
    };

    if !update_res.status().is_success() {
        let status = update_res.status();
        let err_text = update_res.text().await.unwrap_or_default();
        return Err(AppError::Message(format!(
            "Keycloak update failed with status {status}: {err_text}"
        )));
    }

    info!(
        "Successfully synchronized user {} to Keycloak (enabled={}, is_suspended={})",
        email, enabled, is_suspended
    );
    Ok(())
}
