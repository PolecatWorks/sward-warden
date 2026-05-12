use crate::error::AppError;
use crate::weather::data::{WeatherData, get_static_forecast};
use chrono::{DateTime, Utc};

pub struct WeatherService;

impl WeatherService {
    pub async fn get_forecast(_lat: f64, _lon: f64) -> Result<Vec<WeatherData>, AppError> {
        // In the future, this would call a real weather API
        Ok(get_static_forecast())
    }

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
