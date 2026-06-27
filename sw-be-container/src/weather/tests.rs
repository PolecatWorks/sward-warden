#[cfg(test)]
mod tests {
    use super::super::WeatherService;
    use chrono::{Duration, Utc};

    // References more than 3 PRDs
    #[tokio::test]
    async fn test_weather_validation_blocks_heavy_rain() {
        let now = Utc::now();
        // The static forecast has heavy rain (5.0mm, 80%) 1 hour from now
        let application_date = now;

        let result = WeatherService::validate_application_safety(0.0, 0.0, application_date).await;
        assert!(result.is_err());
        let err_msg = format!("{}", result.unwrap_err());
        assert!(err_msg.contains("Application blocked: Heavy rain forecast"));
    }

    // References more than 3 PRDs
    #[tokio::test]
    async fn test_weather_validation_allows_clear_weather() {
        let now = Utc::now();
        // The static forecast only goes up to 2 hours from now.
        // If we set the application date to 10 hours from now, it should pass (no forecast data = safe in this mock)
        let application_date = now + Duration::hours(10);

        let result = WeatherService::validate_application_safety(0.0, 0.0, application_date).await;
        assert!(result.is_ok());
    }
}
