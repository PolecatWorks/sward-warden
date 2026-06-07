use crate::error::AppError;
use crate::models::Farm;
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::{
    Json,
    extract::{Path, State},
};
use reqwest::StatusCode;

pub async fn list_farms(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<Farm>>, AppError> {
    if let Some(cached_farms) = state.farms_cache.read().await.get(&user_id) {
        return Ok(Json(cached_farms.clone()));
    }

    let farms = sqlx::query_as::<_, Farm>(
        "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE user_id = $1 AND is_deleted = FALSE"
    )
    .bind(user_id)
    .fetch_all(&state.db_pool)
    .await?;
    state
        .farms_cache
        .write()
        .await
        .insert(user_id, farms.clone());
    Ok(Json(farms))
}

pub async fn create_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, AppError> {
    let new_farm = sqlx::query_as::<_, Farm>(
        "INSERT INTO farms (user_id, name, location, has_derogation) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
    )
    .bind(user_id)
    .bind(&farm.name)
    .bind(&farm.location)
    .bind(farm.has_derogation.unwrap_or(false))
    .fetch_one(&state.db_pool)
    .await?;
    state.farms_cache.write().await.remove(&user_id);
    Ok(Json(new_farm))
}

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

    sqlx::query(
        "UPDATE farms SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db_pool)
    .await?;
    state.farms_cache.write().await.remove(&user_id);
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<Json<Farm>, AppError> {
    let farm = sqlx::query_as::<_, Farm>(
        "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE"
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(farm))
}

pub async fn update_farm(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, AppError> {
    let updated_farm = sqlx::query_as::<_, Farm>(
        "UPDATE farms SET name = $1, location = $2, has_derogation = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 AND is_deleted = FALSE RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
    )
    .bind(&farm.name)
    .bind(&farm.location)
    .bind(farm.has_derogation.unwrap_or(false))
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;
    state.farms_cache.write().await.remove(&user_id);
    Ok(Json(updated_farm))
}
