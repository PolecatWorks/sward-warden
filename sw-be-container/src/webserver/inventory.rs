use crate::error::AppError;
use crate::models::InventoryStorage;
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::extract::Path;
use axum::{Json, extract::State};

pub async fn list_inventory_storage(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<InventoryStorage>>, AppError> {
    let storages = sqlx::query_as::<_, InventoryStorage>(
        "SELECT id, uuid, tenant_id, farm_id, name, storage_type, capacity_volume::DOUBLE PRECISION as capacity_volume, is_covered, created_at, updated_at FROM inventory_storage WHERE tenant_id = $1"
    )
    .bind(user_id)
    .fetch_all(&state.db_pool)
    .await?;
    Ok(Json(storages))
}

pub async fn create_inventory_storage(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(storage): Json<InventoryStorage>,
) -> Result<Json<InventoryStorage>, AppError> {
    if let Some(farm_id) = storage.farm_id {
        let farm_belongs = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)"
        )
        .bind(farm_id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?;

        if !farm_belongs {
            return Err(AppError::Forbidden(
                "Farm does not belong to user".to_string(),
            ));
        }
    }

    let inserted = sqlx::query_as::<_, InventoryStorage>(
        r#"
        INSERT INTO inventory_storage (tenant_id, farm_id, name, storage_type, capacity_volume, is_covered)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, uuid, tenant_id, farm_id, name, storage_type, capacity_volume::DOUBLE PRECISION as capacity_volume, is_covered, created_at, updated_at
        "#
    )
    .bind(user_id)
    .bind(storage.farm_id)
    .bind(&storage.name)
    .bind(&storage.storage_type)
    .bind(storage.capacity_volume)
    .bind(storage.is_covered)
    .fetch_one(&state.db_pool)
    .await?;

    Ok(Json(inserted))
}

pub async fn update_inventory_storage(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
    Json(storage): Json<InventoryStorage>,
) -> Result<Json<InventoryStorage>, AppError> {
    if let Some(farm_id) = storage.farm_id {
        let farm_belongs = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)"
        )
        .bind(farm_id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?;

        if !farm_belongs {
            return Err(AppError::Forbidden(
                "Farm does not belong to user".to_string(),
            ));
        }
    }

    let updated = sqlx::query_as::<_, InventoryStorage>(
        r#"
        UPDATE inventory_storage
        SET farm_id = $1, name = $2, storage_type = $3, capacity_volume = $4, is_covered = $5, updated_at = NOW()
        WHERE id = $6 AND tenant_id = $7
        RETURNING id, uuid, tenant_id, farm_id, name, storage_type, capacity_volume::DOUBLE PRECISION as capacity_volume, is_covered, created_at, updated_at
        "#
    )
    .bind(storage.farm_id)
    .bind(&storage.name)
    .bind(&storage.storage_type)
    .bind(storage.capacity_volume)
    .bind(storage.is_covered)
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db_pool)
    .await?
    .ok_or(AppError::NotFound("Inventory storage not found".to_string()))?;

    Ok(Json(updated))
}

pub async fn delete_inventory_storage(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<axum::http::StatusCode, AppError> {
    let result = sqlx::query("DELETE FROM inventory_storage WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(&state.db_pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(
            "Inventory storage not found".to_string(),
        ));
    }

    Ok(axum::http::StatusCode::NO_CONTENT)
}
