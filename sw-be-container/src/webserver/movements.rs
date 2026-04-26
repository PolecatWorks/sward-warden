use axum::{Json, extract::State};
use crate::error::AppError;
use crate::models::SwardMovement;
use crate::state::AppState;

pub async fn list_sward_movements(
    State(state): State<AppState>,
) -> Result<Json<Vec<SwardMovement>>, AppError> {
    let movements = sqlx::query_as::<_, SwardMovement>(
        "SELECT sm.id, sm.farm_id, sm.movement_type, sm.quantity_m3, sm.date, sm.manure_type, sm.consignee_name, sm.consignee_address, sm.consignor_name, sm.consignor_address, sm.transporter_name, sm.contract_length_months, sm.updated_at, sm.is_deleted FROM sward_movements sm JOIN farms fa ON sm.farm_id = fa.id WHERE fa.user_id = 1 AND sm.is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await?;
    Ok(Json(movements))
}

pub async fn create_sward_movement(
    State(state): State<AppState>,
    Json(movement): Json<SwardMovement>,
) -> Result<Json<SwardMovement>, AppError> {
    let new_movement = sqlx::query_as::<_, SwardMovement>(
        "INSERT INTO sward_movements (farm_id, movement_type, quantity_m3, date, manure_type, consignee_name, consignee_address, consignor_name, consignor_address, transporter_name, contract_length_months)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, farm_id, movement_type, quantity_m3, date, manure_type, consignee_name, consignee_address, consignor_name, consignor_address, transporter_name, contract_length_months, updated_at, is_deleted"
    )
    .bind(movement.farm_id)
    .bind(&movement.movement_type)
    .bind(movement.quantity_m3)
    .bind(&movement.date)
    .bind(&movement.manure_type)
    .bind(&movement.consignee_name)
    .bind(&movement.consignee_address)
    .bind(&movement.consignor_name)
    .bind(&movement.consignor_address)
    .bind(&movement.transporter_name)
    .bind(movement.contract_length_months)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(new_movement))
}
