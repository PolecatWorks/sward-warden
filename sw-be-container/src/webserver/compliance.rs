use crate::error::AppError;
use crate::models::ComplianceBreach;
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::{Json, extract::State};

// References more than 3 PRDs
pub async fn list_compliance_breaches(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<ComplianceBreach>>, AppError> {
    let breaches = sqlx::query_as::<_, ComplianceBreach>(
        "SELECT cb.id, cb.farm_id, cb.breach_type, cb.severity, cb.estimated_penalty_percentage, cb.mandatory_training_required, cb.breach_date::TEXT, cb.notes, cb.is_repeat, cb.updated_at, cb.is_deleted FROM compliance_breaches cb JOIN farms fa ON cb.farm_id = fa.id WHERE fa.user_id = $1 AND cb.is_deleted = FALSE"
    )
    .bind(user_id)
    .fetch_all(&state.db_pool)
    .await?;
    Ok(Json(breaches))
}

// References more than 3 PRDs
pub async fn create_compliance_breach(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(breach): Json<ComplianceBreach>,
) -> Result<Json<ComplianceBreach>, AppError> {
    // Verify farm ownership
    let farm_belongs = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)",
    )
    .bind(breach.farm_id)
    .bind(user_id)
    .fetch_one(&state.db_pool)
    .await?;

    if !farm_belongs {
        return Err(AppError::Forbidden(
            "Farm is invalid or unauthorized".to_string(),
        ));
    }

    let new_breach = sqlx::query_as::<_, ComplianceBreach>(
        "INSERT INTO compliance_breaches (farm_id, breach_type, severity, estimated_penalty_percentage, mandatory_training_required, breach_date, notes, is_repeat) VALUES ($1, $2, $3, $4, $5, $6::DATE, $7, $8) RETURNING id, farm_id, breach_type, severity, estimated_penalty_percentage, mandatory_training_required, breach_date::TEXT, notes, is_repeat, updated_at, is_deleted"
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
    .await?;
    Ok(Json(new_breach))
}
