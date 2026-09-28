//! Weather background worker for periodic forecasting updates.

use crate::config::WeatherJobConfig;
use crate::error::AppError;
use crate::weather::service::WeatherService;
use chrono::Utc;
use sqlx::{PgPool, Row};
use tokio::time::sleep;
use tokio_util::sync::CancellationToken;
use tracing::{info, warn, error};

// PRD Reference: 0008
pub async fn start_weather_worker(
    config: WeatherJobConfig,
    db_pool: PgPool,
    ct: CancellationToken,
) {
    info!(
        "Starting weather background worker (check: {:?}, update: {:?})",
        config.check_interval, config.update_interval
    );

    loop {
        tokio::select! {
            _ = sleep(config.check_interval) => {
                if let Err(e) = run_weather_update(&config, &db_pool).await {
                    error!("Weather worker error: {}", e);
                }
            }
            _ = ct.cancelled() => {
                info!("Weather background worker shutting down due to cancellation");
                break;
            }
        }
    }
}

// PRD Reference: 0008
async fn run_weather_update(config: &WeatherJobConfig, db_pool: &PgPool) -> Result<(), AppError> {
    let mut tx = db_pool.begin().await.map_err(|e| {
        AppError::Message(format!("Worker failed to start transaction: {}", e))
    })?;

    // Advisory lock for the specific job name "weather_update"
    let lock_id: i64 = 8274917; // Arbitrary constant for weather job

    // Try to acquire the lock
    let lock_acquired: bool = sqlx::query("SELECT pg_try_advisory_xact_lock($1)")
        .bind(lock_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| AppError::Message(format!("Failed to acquire advisory lock: {}", e)))?
        .get(0);

    if !lock_acquired {
        return Ok(()); // Another replica is running the job
    }

    // Check last run time
    let last_run_row = sqlx::query("SELECT last_run FROM job_locks WHERE job_name = 'weather_update'")
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| AppError::Message(format!("Failed to check last run: {}", e)))?;

    let now = Utc::now();
    let mut should_run = true;

    if let Some(row) = last_run_row {
        let last_run: chrono::DateTime<Utc> = row.get(0);
        let elapsed = now.signed_duration_since(last_run);

        if elapsed.num_seconds() < config.update_interval.as_secs() as i64 {
            should_run = false;
        }
    }

    if !should_run {
        tx.commit().await.map_err(|e| AppError::Message(format!("Commit failed: {}", e)))?;
        return Ok(());
    }

    info!("Weather worker running update...");

    // 1. Get all fields with their center points
    // Center point calculation uses bounding box center to align with spatial guidelines
    let fields = sqlx::query(
        "SELECT
            id,
            ST_X(ST_Centroid(ST_Envelope(geom::geometry))) as lon,
            ST_Y(ST_Centroid(ST_Envelope(geom::geometry))) as lat
        FROM fields"
    )
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| AppError::Message(format!("Failed to query fields: {}", e)))?;

    for row in fields {
        let field_id: i64 = row.get("id");
        let lon: f64 = row.get("lon");
        let lat: f64 = row.get("lat");

        // 2. Fetch forecast
        match WeatherService::get_forecast(lat, lon).await {
            Ok(forecast) => {
                // Delete old cache for this field
                sqlx::query("DELETE FROM field_weather_cache WHERE field_id = $1")
                    .bind(field_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to clear old weather cache: {}", e)))?;

                // Insert new data
                for entry in forecast {
                    let is_forecast = entry.timestamp > now;
                    sqlx::query(
                        "INSERT INTO field_weather_cache (field_id, timestamp, precipitation_mm, temperature, is_forecast)
                         VALUES ($1, $2, $3, $4, $5)"
                    )
                    .bind(field_id)
                    .bind(entry.timestamp)
                    .bind(entry.precipitation_amount_mm)
                    .bind(entry.temperature)
                    .bind(is_forecast)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to insert weather cache: {}", e)))?;
                }
            }
            Err(e) => {
                warn!("Failed to fetch forecast for field {}: {}", field_id, e);
                // Continue to next field even if one fails
            }
        }
    }

    // Update job lock
    sqlx::query(
        "INSERT INTO job_locks (job_name, last_run) VALUES ('weather_update', $1)
         ON CONFLICT (job_name) DO UPDATE SET last_run = EXCLUDED.last_run"
    )
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| AppError::Message(format!("Failed to update job lock: {}", e)))?;

    tx.commit().await.map_err(|e| AppError::Message(format!("Worker commit failed: {}", e)))?;
    info!("Weather worker update complete");

    Ok(())
}