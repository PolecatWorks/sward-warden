use crate::error::AppError;
use crate::state::AppState;
use crate::weather::{WeatherData, WeatherService};
use axum::{
    Json,
    extract::{Query, State},
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct ForecastParams {
    pub lat: f64,
    pub lon: f64,
}

pub async fn get_forecast(
    State(_state): State<AppState>,
    Query(params): Query<ForecastParams>,
) -> Result<Json<Vec<WeatherData>>, AppError> {
    let forecast = WeatherService::get_forecast(params.lat, params.lon).await?;
    Ok(Json(forecast))
}
