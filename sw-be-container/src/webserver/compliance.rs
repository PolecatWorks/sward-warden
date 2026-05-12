use crate::error::AppError;
use crate::models::ComplianceBreach;
use crate::state::AppState;
use axum::{Json, extract::State};

pub async fn list_compliance_breaches(
    State(state): State<AppState>,
) -> Result<Json<Vec<ComplianceBreach>>, AppError> {
    let breaches = sqlx::query_as::<_, ComplianceBreach>(
        "SELECT id, farm_id, breach_type, severity, estimated_penalty_percentage, mandatory_training_required, breach_date, notes, is_repeat, updated_at, is_deleted FROM compliance_breaches WHERE is_deleted = FALSE"
    )
    .fetch_all(&state.db_pool)
    .await;
    Ok(Json(breaches?))
}

pub async fn create_compliance_breach(
    State(state): State<AppState>,
    Json(breach): Json<ComplianceBreach>,
) -> Result<Json<ComplianceBreach>, AppError> {
    let new_breach = sqlx::query_as::<_, ComplianceBreach>(
        "INSERT INTO compliance_breaches (farm_id, breach_type, severity, estimated_penalty_percentage, mandatory_training_required, breach_date, notes, is_repeat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, farm_id, breach_type, severity, estimated_penalty_percentage, mandatory_training_required, breach_date, notes, is_repeat, updated_at, is_deleted"
    )
    .bind(breach.farm_id)
    .bind(&breach.breach_type)
    .bind(&breach.severity)
    .bind(breach.estimated_penalty_percentage)
    .bind(&breach.mandatory_training_required)
    .bind(&breach.breach_date)
    .bind(&breach.notes)
    .bind(breach.is_repeat)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_breach?))
}
