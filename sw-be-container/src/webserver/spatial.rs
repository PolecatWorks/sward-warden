use crate::error::AppError;
use crate::spatial::SpatialService;
use crate::spatial::models::{ExtentsRequest, ExtentsResponse};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Query, State},
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct BufferParams {
    pub distance: f64,
}

// References more than 3 PRDs
pub async fn get_waterway_buffers(
    State(state): State<AppState>,
    Query(params): Query<BufferParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let geojson_str =
        SpatialService::get_buffer_geometries_geojson(&state.db_pool, params.distance).await?;
    let geojson: serde_json::Value =
        serde_json::from_str(&geojson_str).unwrap_or(serde_json::json!({}));
    Ok(Json(geojson))
}

// PRD Reference: 0004
pub async fn calculate_extents(
    Json(payload): Json<ExtentsRequest>,
) -> Result<Json<ExtentsResponse>, AppError> {
    let result = SpatialService::calculate_extents(payload.geometries)?;
    Ok(Json(result))
}
