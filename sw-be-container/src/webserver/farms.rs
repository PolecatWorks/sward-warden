//! Farm holding management HTTP handlers.

use crate::error::AppError;
use crate::models::{EntityQuery, Farm};
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::{
    Json,
    extract::{Path, Query, State},
};
use reqwest::StatusCode;

// References more than 3 PRDs
pub async fn list_farms(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(params): Query<EntityQuery>,
) -> Result<Json<Vec<Farm>>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    let target_user_id = if is_admin {
        params.user_id
    } else {
        if let Some(requested_uid) = params.user_id {
            if requested_uid != user_id {
                return Err(AppError::Forbidden(
                    "Cannot query another user's farms".to_string(),
                ));
            }
        }
        Some(user_id)
    };

    if !is_admin && params.user_id.is_none() {
        if let Some(cached_farms) = state.farms_cache.read().await.get(&user_id) {
            return Ok(Json(cached_farms.clone()));
        }
    }

    let farms = match target_user_id {
        Some(uid) => {
            sqlx::query_as::<_, Farm>(
                "SELECT id, user_id, name, location, has_derogation, photo, updated_at, is_deleted FROM farms WHERE user_id = $1 AND is_deleted = FALSE"
            )
            .bind(uid)
            .fetch_all(&state.db_pool)
            .await?
        }
        None => {
            sqlx::query_as::<_, Farm>(
                "SELECT id, user_id, name, location, has_derogation, photo, updated_at, is_deleted FROM farms WHERE is_deleted = FALSE"
            )
            .fetch_all(&state.db_pool)
            .await?
        }
    };

    if !is_admin && params.user_id.is_none() {
        state
            .farms_cache
            .write()
            .await
            .insert(user_id, farms.clone());
    }
    Ok(Json(farms))
}

// References more than 3 PRDs
pub async fn create_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;
    let target_user_id = if is_admin {
        farm.user_id.unwrap_or(user_id)
    } else {
        user_id
    };

    // Ensure target_user_id exists in users table to prevent FK constraint failure
    sqlx::query(
        "INSERT INTO users (id, name, email, role, keycloak_sub) VALUES ($1, $2, $3, 'user', $4) ON CONFLICT (id) DO NOTHING",
    )
    .bind(target_user_id)
    .bind(format!("User {}", target_user_id))
    .bind(format!("user{}@example.com", target_user_id))
    .bind(target_user_id.to_string())
    .execute(&state.db_pool)
    .await?;

    let new_farm = sqlx::query_as::<_, Farm>(
        "INSERT INTO farms (user_id, name, location, has_derogation, photo) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, name, location, has_derogation, photo, updated_at, is_deleted"
    )
    .bind(target_user_id)
    .bind(&farm.name)
    .bind(&farm.location)
    .bind(farm.has_derogation.unwrap_or(false))
    .bind(&farm.photo)
    .fetch_one(&state.db_pool)
    .await?;
    state.farms_cache.write().await.remove(&target_user_id);
    Ok(Json(new_farm))
}

// References more than 3 PRDs
pub async fn delete_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    // Check if active fields exist on this farm
    let active_fields_exist = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM fields WHERE farm_id = $1 AND is_deleted = FALSE)",
    )
    .bind(id)
    .fetch_one(&state.db_pool)
    .await?;

    if active_fields_exist {
        return Err(AppError::BadRequest(
            "Cannot delete farm with active fields. Please move the fields to another farm first."
                .to_string(),
        ));
    }

    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    let result = if is_admin {
        sqlx::query("UPDATE farms SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&state.db_pool)
            .await?
    } else {
        sqlx::query(
            "UPDATE farms SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2",
        )
        .bind(id)
        .bind(user_id)
        .execute(&state.db_pool)
        .await?
    };

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Farm not found".to_string()));
    }

    state.farms_cache.write().await.remove(&user_id);
    Ok(StatusCode::NO_CONTENT)
}

// References more than 3 PRDs
pub async fn get_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<Json<Farm>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    let farm = if is_admin {
        sqlx::query_as::<_, Farm>(
            "SELECT id, user_id, name, location, has_derogation, photo, updated_at, is_deleted FROM farms WHERE id = $1 AND is_deleted = FALSE"
        )
        .bind(id)
        .fetch_one(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Farm>(
            "SELECT id, user_id, name, location, has_derogation, photo, updated_at, is_deleted FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE"
        )
        .bind(id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?
    };
    Ok(Json(farm))
}

// References more than 3 PRDs
pub async fn update_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    let updated_farm = if is_admin {
        sqlx::query_as::<_, Farm>(
            "UPDATE farms SET name = $1, location = $2, has_derogation = $3, photo = $4, updated_at = NOW() WHERE id = $5 AND is_deleted = FALSE RETURNING id, user_id, name, location, has_derogation, photo, updated_at, is_deleted"
        )
        .bind(&farm.name)
        .bind(&farm.location)
        .bind(farm.has_derogation.unwrap_or(false))
        .bind(&farm.photo)
        .bind(id)
        .fetch_one(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Farm>(
            "UPDATE farms SET name = $1, location = $2, has_derogation = $3, photo = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6 AND is_deleted = FALSE RETURNING id, user_id, name, location, has_derogation, photo, updated_at, is_deleted"
        )
        .bind(&farm.name)
        .bind(&farm.location)
        .bind(farm.has_derogation.unwrap_or(false))
        .bind(&farm.photo)
        .bind(id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?
    };
    state.farms_cache.write().await.remove(&user_id);
    Ok(Json(updated_farm))
}
