use crate::error::AppError;
use crate::models::Farm;
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
};
use reqwest::StatusCode;

pub async fn list_farms(State(state): State<AppState>) -> Result<Json<Vec<Farm>>, AppError> {
    if let Some(cached_farms) = &*state.farms_cache.read().await {
        return Ok(Json(cached_farms.clone()));
    }

    let farms = sqlx::query_as::<_, Farm>(
        "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE user_id = 1 AND is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = Some(farms.clone());
    Ok(Json(farms))
}

pub async fn create_farm(
    State(state): State<AppState>,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, AppError> {
    let new_farm = sqlx::query_as::<_, Farm>(
        "INSERT INTO farms (user_id, name, location, has_derogation) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
    )
    .bind(1i64)
    .bind(&farm.name)
    .bind(&farm.location)
    .bind(farm.has_derogation.unwrap_or(false))
    .fetch_one(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = None;
    Ok(Json(new_farm))
}

pub async fn delete_farm(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    sqlx::query(
        "UPDATE farms SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = 1",
    )
    .bind(id)
    .execute(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = None;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_farm(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<Farm>, AppError> {
    let farm = sqlx::query_as::<_, Farm>(
        "SELECT id, user_id, name, location, has_derogation, updated_at, is_deleted FROM farms WHERE id = $1 AND user_id = 1 AND is_deleted = FALSE"
    )
    .bind(id)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(farm))
}

pub async fn update_farm(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(farm): Json<Farm>,
) -> Result<Json<Farm>, AppError> {
    let updated_farm = sqlx::query_as::<_, Farm>(
        "UPDATE farms SET name = $1, location = $2, has_derogation = $3, updated_at = NOW() WHERE id = $4 AND user_id = 1 AND is_deleted = FALSE RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
    )
    .bind(&farm.name)
    .bind(&farm.location)
    .bind(farm.has_derogation.unwrap_or(false))
    .bind(id)
    .fetch_one(&state.db_pool)
    .await?;
    *state.farms_cache.write().await = None;
    Ok(Json(updated_farm))
}
