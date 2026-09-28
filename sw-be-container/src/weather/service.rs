//! Weather evaluation and application safety validation service.

use crate::error::AppError;
use crate::weather::data::{WeatherData, get_static_forecast, OpenMeteoResponse};
use chrono::{DateTime, Utc, TimeZone, NaiveDateTime};
use reqwest::Client;

/// Service providing weather forecasts and weather-dependent spreading safety checks.
pub struct WeatherService;

impl WeatherService {
    /// Retrieves weather forecast entries for specified latitude and longitude coordinates.
    // PRD Reference: 0008
    pub async fn get_forecast(lat: f64, lon: f64) -> Result<Vec<WeatherData>, AppError> {
        #[cfg(test)]
        {
            return Ok(get_static_forecast());
        }
        let url = format!(
            "https://api.open-meteo.com/v1/forecast?latitude={}&longitude={}&hourly=temperature_2m,precipitation,precipitation_probability,wind_speed_10m&timezone=UTC",
            lat, lon
        );

        let client = Client::new();
        let res = client.get(&url).send().await.map_err(|e| {
            AppError::Message(format!("Failed to fetch weather data: {}", e))
        })?;

        let data: OpenMeteoResponse = res.json().await.map_err(|e| {
            AppError::Message(format!("Failed to parse weather data: {}", e))
        })?;

        let mut forecast = Vec::new();
        for i in 0..data.hourly.time.len() {
            let time_str = &data.hourly.time[i];
            let time = NaiveDateTime::parse_from_str(time_str, "%Y-%m-%dT%H:%M").map_err(|e| {
                AppError::Message(format!("Failed to parse time {}: {}", time_str, e))
            })?;

            let timestamp = Utc.from_utc_datetime(&time);

            forecast.push(WeatherData {
                timestamp,
                temperature: data.hourly.temperature_2m[i],
                precipitation_amount_mm: data.hourly.precipitation[i],
                precipitation_probability: data.hourly.precipitation_probability.as_ref().map_or(0.0, |p| p[i]),
                wind_speed_kph: data.hourly.wind_speed_10m.as_ref().map_or(0.0, |w| w[i]),
                condition: "".to_string(), // Open-Meteo doesn't provide condition string directly in this endpoint
            });
        }

        Ok(forecast)
    }

    /// Validates whether spreading applications are safe based on 48-hour precipitation forecasts.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::BadRequest`] if heavy rainfall (>10mm or >75% probability) is forecast.
    // References more than 3 PRDs
    pub async fn validate_application_safety(
        lat: f64,
        lon: f64,
        date: DateTime<Utc>,
    ) -> Result<(), AppError> {
        let forecast = Self::get_forecast(lat, lon).await?;

        for entry in forecast {
            // Check if this forecast entry is within 48 hours of the application date
            let diff = entry.timestamp.signed_duration_since(date).num_hours();
            if (0..=48).contains(&diff)
                && (entry.precipitation_amount_mm > 10.0 || entry.precipitation_probability > 75.0) {
                    return Err(AppError::BadRequest(format!(
                        "Application blocked: Heavy rain forecast ({:.1}mm, {:.0}%) at {}",
                        entry.precipitation_amount_mm,
                        entry.precipitation_probability,
                        entry.timestamp.format("%Y-%m-%d %H:%M")
                    )));
                }
        }

        Ok(())
    }
}
