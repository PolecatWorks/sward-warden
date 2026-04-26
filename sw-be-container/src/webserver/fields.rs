use axum::{Json, extract::{Path, State}};
use reqwest::StatusCode;
use crate::error::AppError;
use crate::models::Field;
use crate::state::AppState;

pub async fn list_fields(State(state): State<AppState>) -> Result<Json<Vec<Field>>, AppError> {
    let fields = sqlx::query_as::<_, Field>(
        "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = 1 AND f.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(fields?))
}

pub async fn create_field(
    State(state): State<AppState>,
    Json(field): Json<Field>,
) -> Result<Json<Field>, AppError> {
    let new_field = sqlx::query_as::<_, Field>(
        "INSERT INTO fields (farm_id, name, area_hectares, land_use) VALUES ($1, $2, $3, $4) RETURNING id, farm_id, name, area_hectares, land_use, updated_at, is_deleted"
    )
    .bind(field.farm_id)
    .bind(&field.name)
    .bind(field.area_hectares)
    .bind(&field.land_use)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_field?))
}

pub async fn delete_field(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    sqlx::query("UPDATE fields SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND farm_id IN (SELECT id FROM farms WHERE user_id = 1)")
        .bind(id)
        .execute(&state.db_pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}
