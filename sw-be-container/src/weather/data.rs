use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WeatherData {
    pub timestamp: DateTime<Utc>,
    pub temperature: f64,
    pub precipitation_probability: f64,
    pub precipitation_amount_mm: f64,
    pub wind_speed_kph: f64,
    pub condition: String,
}

pub fn get_static_forecast() -> Vec<WeatherData> {
    let now = Utc::now();
    vec![
        WeatherData {
            timestamp: now,
            temperature: 12.0,
            precipitation_probability: 10.0,
            precipitation_amount_mm: 0.0,
            wind_speed_kph: 15.0,
            condition: "Cloudy".to_string(),
        },
        WeatherData {
            timestamp: now + chrono::Duration::hours(1),
            temperature: 11.5,
            precipitation_probability: 80.0,
            precipitation_amount_mm: 5.0,
            wind_speed_kph: 20.0,
            condition: "Heavy Rain".to_string(),
        },
        WeatherData {
            timestamp: now + chrono::Duration::hours(2),
            temperature: 10.0,
            precipitation_probability: 90.0,
            precipitation_amount_mm: 12.0,
            wind_speed_kph: 25.0,
            condition: "Stormy".to_string(),
        },
    ]
}
