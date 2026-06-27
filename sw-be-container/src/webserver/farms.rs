use crate::error::AppError;
use crate::models::Farm;
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::{
    Json,
    extract::{Path, State},
};
use reqwest::StatusCode;

// References more than 3 PRDs
pub async fn list_farms(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<Farm>>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    if !is_admin {
        if let Some(cached_farms) = state.farms_cache.read().await.get(&user_id) {
            return Ok(Json(cached_farms.clone()));
        }
    }

    let farms = if is_admin {
        sqlx::query_as::<_, Farm>(
            "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE is_deleted = FALSE"
        )
        .fetch_all(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Farm>(
            "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE user_id = $1 AND is_deleted = FALSE"
        )
        .bind(user_id)
        .fetch_all(&state.db_pool)
        .await?
    };

    if !is_admin {
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

    let new_farm = sqlx::query_as::<_, Farm>(
        "INSERT INTO farms (user_id, name, location, has_derogation) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
    )
    .bind(target_user_id)
    .bind(&farm.name)
    .bind(&farm.location)
    .bind(farm.has_derogation.unwrap_or(false))
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
            "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE id = $1 AND is_deleted = FALSE"
        )
        .bind(id)
        .fetch_one(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Farm>(
            "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE"
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
            "UPDATE farms SET name = $1, location = $2, has_derogation = $3, updated_at = NOW() WHERE id = $4 AND is_deleted = FALSE RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
        )
        .bind(&farm.name)
        .bind(&farm.location)
        .bind(farm.has_derogation.unwrap_or(false))
        .bind(id)
        .fetch_one(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Farm>(
            "UPDATE farms SET name = $1, location = $2, has_derogation = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 AND is_deleted = FALSE RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
        )
        .bind(&farm.name)
        .bind(&farm.location)
        .bind(farm.has_derogation.unwrap_or(false))
        .bind(id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?
    };
    state.farms_cache.write().await.remove(&user_id);
    Ok(Json(updated_farm))
}
