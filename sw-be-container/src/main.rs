pub mod cli;
pub mod config;
pub mod error;
pub mod hams;
pub mod metrics;
pub mod models;
pub mod optimization;
mod rules;
mod rules_tests;
pub mod seed;
pub mod spatial;
pub mod startup_tools;
pub mod state;
pub mod tokio_tools;
pub mod weather;
pub mod webserver;

use axum_prometheus::metrics_exporter_prometheus::PrometheusBuilder;
use clap::Parser;
use std::ffi::c_void;
use tokio_util::sync::CancellationToken;
use tracing::info;

use ::hams::hams::Hams;
use ::hams::probe::AsyncHealthProbe;
use ::hams::probe::FFIProbe;
use ::hams::probe::manual::Manual as ProbeManual;

use crate::cli::{Cli, Commands};
use crate::config::AppConfig;
use crate::error::AppError;
use crate::metrics::{prometheus_response_free, prometheus_response_mystate};
use crate::state::AppState;
use crate::tokio_tools::run_in_tokio;
use crate::webserver::start_app_api;

pub const NAME: &str = env!("CARGO_PKG_NAME");
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() -> Result<(), AppError> {
    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let cli = Cli::parse();

    match &cli.command {
        Commands::Serve => {
            let mut delay = None;

            let result = (|| -> Result<(), AppError> {
                let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
                delay = config.debugging.fail_debug_delay;

                println!(
                    "Config:\n{}",
                    serde_yaml::to_string(&config).map_err(|e| AppError::Message(format!(
                        "Failed to serialize config: {e}"
                    )))?
                );

                let ct = CancellationToken::new();

                // HaMS setup before async runtime
                let mut hams_config = config.hams.clone();
                hams_config.name = NAME.to_owned();
                hams_config.version = VERSION.to_owned();

                let mut hams = Hams::new(hams_config);

                // HaMS Probes - setup before async to avoid blocking runtime
                let db_probe = ProbeManual::new("db-connected", true);
                hams.ready_insert(
                    Box::new(FFIProbe::from(db_probe.clone())) as Box<dyn AsyncHealthProbe>
                );

                hams.start()
                    .map_err(|e| AppError::Message(format!("Failed to start HaMS: {e}")))?;

                let res = run_in_tokio(
                    &config.runtime,
                    service_cancellable(ct, config.clone(), &mut hams),
                );

                if let Err(e) = hams.deregister_prometheus() {
                    tracing::error!("Failed to deregister prometheus: {e}");
                }

                if let Err(e) = hams.stop() {
                    tracing::info!("Failed to stop HaMS, it may already be stopped: {e}");
                }

                res
            })();

            if let Err(e) = result {
                if let Some(d) = delay {
                    tracing::error!(
                        "Serve failed: {}. Sleeping for {:?} before exiting...",
                        e,
                        d
                    );
                    std::thread::sleep(d);
                }
                return Err(e);
            }
        }
        Commands::Version => {
            println!("sw-be {}", VERSION);
        }
        Commands::Migrate => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            println!(
                "Config:\n{}",
                serde_yaml::to_string(&config)
                    .map_err(|e| AppError::Message(format!("Failed to serialize config: {e}")))?
            );
            let delay = config.debugging.fail_debug_delay;
            if let Err(e) = run_in_tokio(&config.runtime, async move {
                let db_url: url::Url = config.database.url.clone().into();
                let db_pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(1)
                    .connect(db_url.as_str())
                    .await
                    .map_err(|e| {
                        AppError::Message(format!("Failed to connect to database: {e}"))
                    })?;

                sqlx::migrate!()
                    .run(&db_pool)
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to run migrations: {e}")))?;

                println!("Migrations completed successfully.");
                Ok(())
            }) {
                if let Some(d) = delay {
                    tracing::error!(
                        "Migrate failed: {}. Sleeping for {:?} before exiting...",
                        e,
                        d
                    );
                    std::thread::sleep(d);
                }
                return Err(e);
            }
        }
        Commands::Seed { user_id } => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            println!(
                "Config:\n{}",
                serde_yaml::to_string(&config)
                    .map_err(|e| AppError::Message(format!("Failed to serialize config: {e}")))?
            );
            let delay = config.debugging.fail_debug_delay;
            if let Err(e) = run_in_tokio(&config.runtime, async move {
                let db_url: url::Url = config.database.url.clone().into();
                let db_pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(1)
                    .connect(db_url.as_str())
                    .await
                    .map_err(|e| {
                        AppError::Message(format!("Failed to connect to database: {e}"))
                    })?;
                seed::seed_database(&db_pool, *user_id).await
            }) {
                if let Some(d) = delay {
                    tracing::error!("Seed failed: {}. Sleeping for {:?} before exiting...", e, d);
                    std::thread::sleep(d);
                }
                return Err(e);
            }
        }
    }

    Ok(())
}

async fn service_cancellable(
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
        startup_tools::run_startup_checks(&config, &db_pool).await?;
    }

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
