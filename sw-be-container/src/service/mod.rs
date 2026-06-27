use axum_prometheus::metrics_exporter_prometheus::PrometheusBuilder;
use std::ffi::c_void;
use tokio_util::sync::CancellationToken;
use tracing::info;

use ::hams::hams::Hams;
use ::hams::probe::AsyncHealthProbe;
use ::hams::probe::FFIProbe;
use ::hams::probe::manual::Manual as ProbeManual;

use crate::config::AppConfig;
use crate::error::AppError;
use crate::metrics::{prometheus_response_free, prometheus_response_mystate};
use crate::state::AppState;
use crate::webserver::start_app_api;
use crate::{NAME, VERSION};

// PRD Reference: 0001, 0009
pub async fn service_cancellable(
    ct: CancellationToken,
    config: AppConfig,
    hams: &mut Hams,
) -> Result<(), AppError> {
    info!("Starting service {} v{}", NAME, VERSION);

    // Setup Prometheus Recorder
    let metric_handle = PrometheusBuilder::new()
        .install_recorder()
        .map_err(|e| AppError::Message(format!("Failed to install Prometheus recorder: {e}")))?;

    let db_url: url::Url = config.database.url.clone().into();
    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(db_url.as_str())
        .await
        .map_err(|e| AppError::Message(format!("Failed to connect to database: {e}")))?;

    sqlx::migrate!()
        .run(&db_pool)
        .await
        .map_err(|e| AppError::Message(format!("Failed to run database migrations: {e}")))?;

    let state = AppState::new(config.clone(), metric_handle, db_pool.clone());

    if config.startup_checks.enabled {
        startup_tools_run(&config, &db_pool).await?;
    }

    // HaMS Probes
    let db_probe = ProbeManual::new("db-connected", true);
    hams.ready_insert_async(Box::new(FFIProbe::from(db_probe.clone())) as Box<dyn AsyncHealthProbe>).await;

    // HaMS Prometheus Registration
    hams.register_prometheus(
        prometheus_response_mystate,
        prometheus_response_free,
        &state as *const _ as *const c_void,
    )?;

    // Link HaMS shutdown to application cancellation token
    let ct_clone = ct.clone();
    hams.register_shutdown_closure(move || {
        info!("HaMS shutdown callback triggered, cancelling application token");
        ct_clone.cancel();
    })?;

    let server_future = start_app_api(state.clone(), ct.clone());

    server_future.await?;

    Ok(())
}

// PRD Reference: 0001, 0009
// Wrapper for startup tools to avoid direct crate access issues if needed
async fn startup_tools_run(config: &AppConfig, db_pool: &sqlx::PgPool) -> Result<(), AppError> {
    crate::startup_tools::run_startup_checks(config, db_pool).await
}
