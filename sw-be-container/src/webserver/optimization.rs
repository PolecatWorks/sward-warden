use crate::error::AppError;
use crate::optimization::{OptimizationEngine, OptimizationPlan};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Path, State},
};

pub async fn get_farm_suggestions(
    State(state): State<AppState>,
    Path(farm_id): Path<i64>,
) -> Result<Json<OptimizationPlan>, AppError> {
    let plan = OptimizationEngine::get_suggestions(&state.db_pool, farm_id).await?;
    Ok(Json(plan))
}
