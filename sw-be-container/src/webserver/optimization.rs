use axum::{
    extract::{Path, State},
    Json,
};
use crate::error::AppError;
use crate::state::AppState;
use crate::optimization::{OptimizationEngine, OptimizationPlan};

pub async fn get_farm_suggestions(
    State(state): State<AppState>,
    Path(farm_id): Path<i64>,
) -> Result<Json<OptimizationPlan>, AppError> {
    let plan = OptimizationEngine::get_suggestions(&state.db_pool, farm_id).await?;
    Ok(Json(plan))
}
