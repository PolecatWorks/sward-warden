use crate::error::AppError;
use crate::models::Field;
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::{
    Json,
    extract::{Path, State},
};
use reqwest::StatusCode;

pub async fn list_fields(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<Field>>, AppError> {
    let fields = sqlx::query_as::<_, Field>(
        "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = $1 AND f.is_deleted = FALSE"
    )
    .bind(user_id)
    .fetch_all(&state.db_pool)
    .await?;
    Ok(Json(fields))
}

pub async fn get_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<Json<Field>, AppError> {
    let field = sqlx::query_as::<_, Field>(
        "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE f.id = $1 AND fa.user_id = $2 AND f.is_deleted = FALSE"
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(field))
}

pub async fn create_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(field): Json<Field>,
) -> Result<Json<Field>, AppError> {
    // Verify the target farm belongs to the user
    let farm_belongs = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)",
    )
    .bind(field.farm_id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;

    if !farm_belongs {
        return Err(AppError::Forbidden(
            "Target farm is invalid or unauthorized".to_string(),
        ));
    }

    let new_field = sqlx::query_as::<_, Field>(
        "INSERT INTO fields (farm_id, name, area_hectares, land_use) VALUES ($1, $2, $3, $4) RETURNING id, farm_id, name, area_hectares, land_use, updated_at, is_deleted"
    )
    .bind(field.farm_id)
    .bind(&field.name)
    .bind(field.area_hectares)
    .bind(&field.land_use)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(new_field))
}

pub async fn delete_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    sqlx::query(
        "UPDATE fields SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND farm_id IN (SELECT id FROM farms WHERE user_id = $2)"
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db_pool)
    .await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
    Json(field): Json<Field>,
) -> Result<Json<Field>, AppError> {
    // 1. Verify that the destination farm belongs to the user
    let farm_belongs = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)",
    )
    .bind(field.farm_id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;

    if !farm_belongs {
        return Err(AppError::Forbidden(
            "Destination farm is invalid or unauthorized".to_string(),
        ));
    }

    // 2. Perform the update ensuring the field currently belongs to a farm owned by the user
    let updated_field = sqlx::query_as::<_, Field>(
        "UPDATE fields SET farm_id = $1, name = $2, area_hectares = $3, land_use = $4, updated_at = NOW() WHERE id = $5 AND farm_id IN (SELECT id FROM farms WHERE user_id = $6) AND is_deleted = FALSE RETURNING id, farm_id, name, area_hectares, land_use, updated_at, is_deleted"
    )
    .bind(field.farm_id)
    .bind(&field.name)
    .bind(field.area_hectares)
    .bind(&field.land_use)
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;

    Ok(Json(updated_field))
}
