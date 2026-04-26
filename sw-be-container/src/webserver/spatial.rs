use axum::{
    extract::{Query, State},
    Json,
};
use serde::Deserialize;
use crate::error::AppError;
use crate::state::AppState;
use crate::spatial::SpatialService;

#[derive(Deserialize)]
pub struct BufferParams {
    pub distance: f64,
}

pub async fn get_waterway_buffers(
    State(state): State<AppState>,
    Query(params): Query<BufferParams>,
) -> Result<Json<serde_json::Value>, AppError> {
    let geojson_str = SpatialService::get_buffer_geometries_geojson(&state.db_pool, params.distance).await?;
    let geojson: serde_json::Value = serde_json::from_str(&geojson_str).unwrap_or(serde_json::json!({}));
    Ok(Json(geojson))
}
