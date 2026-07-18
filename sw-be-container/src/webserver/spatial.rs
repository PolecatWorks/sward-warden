use crate::error::AppError;
use crate::spatial::SpatialService;
use crate::spatial::models::{ExtentsRequest, ExtentsResponse};
use crate::state::AppState;
use axum::{
    Json,
    extract::{Query, State},
};
use serde::{Deserialize, Serialize};

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

#[derive(Deserialize)]
pub struct CalculateAreaRequest {
    pub geojson: String,
}

#[derive(Serialize)]
pub struct CalculateAreaResponse {
    pub area_sq_meters: f64,
}

// PRD Reference: 0008
pub async fn calculate_area(
    State(_state): State<AppState>,
    Json(req): Json<CalculateAreaRequest>,
) -> Result<Json<CalculateAreaResponse>, AppError> {
    if req.geojson.trim().is_empty() {
        return Err(AppError::BadRequest(
            "GeoJSON string cannot be empty".into(),
        ));
    }

    // validate it is a valid json object with type
    let parsed: Result<serde_json::Value, _> = serde_json::from_str(&req.geojson);
    match parsed {
        Ok(val) => {
            if val.get("type").is_none() {
                return Err(AppError::BadRequest("Invalid GeoJSON geometry".into()));
            }
        }
        Err(_) => return Err(AppError::BadRequest("Invalid JSON string".into())),
    }

    let area_sq_meters = SpatialService::calculate_area_from_polygon(&req.geojson)?;

    Ok(Json(CalculateAreaResponse { area_sq_meters }))
}
