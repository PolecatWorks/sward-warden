use clap::{Parser, Subcommand};
use tokio_util::sync::CancellationToken;

use sw_be_container::config::AppConfig;
use sw_be_container::data::seed;
use sw_be_container::error::AppError;
use sw_be_container::service_cancellable;
use sw_be_container::tokio_tools::run_in_tokio;
use sw_be_container::{NAME, VERSION};

use ::hams::hams::Hams;

#[derive(Parser, Debug, PartialEq)]
#[command(name = "sw-be", about = "Sward management be", version)]
pub struct Cli {
    #[arg(short, long)]
    pub config_path: std::path::PathBuf,

    #[arg(short, long)]
    pub secrets_dir: std::path::PathBuf,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug, PartialEq)]
pub enum Commands {
    /// Start the main application server
    Serve,
    /// Display application version
    Version,
    /// Execute schema migrations against PostgreSQL
    Migrate,
    /// Seed the database with realistic sample data
    Seed {
        /// The user ID to seed data for
        #[arg(long, default_value_t = 1)]
        user_id: i64,
    },
}

fn init_logging(fallback_level: &str) {
    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(fallback_level));

    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .init();
}

// References more than 3 PRDs
fn main() -> Result<(), AppError> {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Serve => {
            let mut delay = None;

            let result = (|| -> Result<(), AppError> {
                let config = AppConfig::load(&cli.config_path, &cli.secrets_dir).map_err(|e| {
                    init_logging("info");
                    tracing::error!("Failed to load config: {}", e);
                    AppError::Message(format!("Failed to load config: {}", e))
                })?;
                init_logging(&config.debugging.log_level);

                delay = Some(config.debugging.fail_debug_delay);

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

                // Initial probes can be added here if they don't block
                // (Though service_cancellable now handles them)

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
            init_logging("info");
            println!("sw-be {}", VERSION);
        }
        Commands::Migrate => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir).map_err(|e| {
                init_logging("info");
                tracing::error!("Failed to load config: {}", e);
                AppError::Message(format!("Failed to load config: {}", e))
            })?;
            init_logging(&config.debugging.log_level);

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
                tracing::error!(
                    "Migrate failed: {}. Sleeping for {:?} before exiting...",
                    e,
                    delay
                );
                std::thread::sleep(delay);
                return Err(e);
            }
        }
        Commands::Seed { user_id } => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir).map_err(|e| {
                init_logging("info");
                tracing::error!("Failed to load config: {}", e);
                AppError::Message(format!("Failed to load config: {}", e))
            })?;
            init_logging(&config.debugging.log_level);

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
                tracing::error!(
                    "Seed failed: {}. Sleeping for {:?} before exiting...",
                    e,
                    delay
                );
                std::thread::sleep(delay);
                return Err(e);
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // PRD Reference: 0001
    #[test]
    fn test_cli_serve() {
        let cli = Cli::try_parse_from(&[
            "sw-be",
            "--config-path",
            "cfg.yaml",
            "--secrets-dir",
            "sec",
            "serve",
        ])
        .unwrap();
        assert_eq!(cli.command, Commands::Serve);
    }

    // PRD Reference: 0001
    #[test]
    fn test_cli_version() {
        let cli = Cli::try_parse_from(&[
            "sw-be",
            "--config-path",
            "cfg.yaml",
            "--secrets-dir",
            "sec",
            "version",
        ])
        .unwrap();
        assert_eq!(cli.command, Commands::Version);
    }

    // PRD Reference: 0001
    #[test]
    fn test_cli_migrate() {
        let cli = Cli::try_parse_from(&[
            "sw-be",
            "--config-path",
            "cfg.yaml",
            "--secrets-dir",
            "sec",
            "migrate",
        ])
        .unwrap();
        assert_eq!(cli.command, Commands::Migrate);
    }

    // PRD Reference: 0001
    #[test]
    fn test_cli_invalid_command() {
        let cli = Cli::try_parse_from(&["sw-be", "invalid"]);
        assert!(cli.is_err());
    }
}
