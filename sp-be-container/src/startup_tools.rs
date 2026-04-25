use std::future::Future;

use futures::FutureExt;
use tracing::{info, warn};

use crate::{
    config::{AppConfig, StartupCheckConfig},
    error::MyError,
};

/// Executes an asynchronous check with a retry mechanism.
///
/// This function repeatedly calls the `make_future` closure to generate and await a future
/// until it succeeds or the maximum number of attempts specified in `config` is reached.
/// It waits for the duration specified in `config.timeout` between failed attempts.
///
/// # Arguments
///
/// * `name` - A descriptive name for the check, used in logging and error messages.
/// * `config` - Configuration defining the number of retries and the timeout between them.
/// * `make_future` - A closure that produces the future to be executed for each attempt.
///
/// # Errors
///
/// Returns `MyError` if the check fails after all configured attempts.
pub async fn run_check<G, F, T>(
    name: String,
    config: &StartupCheckConfig,
    mut make_future: G,
) -> Result<T, MyError>
where
    G: FnMut() -> F, // G is a generator that creates futures
    F: Future<Output = Result<T, MyError>>,
{
    info!("Running check: {name}");

    let mut attempts_remaining = config.fails;

    while attempts_remaining > 0 {
        // Call the closure to get a fresh future instance for this attempt
        match make_future().await {
            Ok(reply) => {
                info!("Check passed: {name}");
                return Ok(reply);
            }
            Err(err) => {
                warn!(
                    "Check failed: {name}, error= {err} rerunning in {:?}",
                    config.timeout
                );
            }
        }

        attempts_remaining -= 1;
        if attempts_remaining > 0 {
            warn!(
                "Check failed: {name}, {attempts_remaining} attempts remaining, rerunning in {:?}",
                config.timeout
            );
            tokio::time::sleep(config.timeout).await;
        }
    }

    Err(MyError::Message(format!(
        "Check {} failed after {} attempts",
        name, config.fails
    )))
}

pub async fn run_startup_checks(config: &AppConfig, db_pool: &sqlx::PgPool) -> Result<(), MyError> {
    let _checks_config = &config.startup_checks;
    let mut futures = Vec::new();

    let pool_clone = db_pool.clone();
    futures.push(
        run_check(
            "Database Connectivity Check".to_string(),
            &config.startup_checks,
            move || {
                let pool = pool_clone.clone();
                async move {
                    pool.acquire()
                        .await
                        .map_err(|e| MyError::Message(format!("DB Check Failed: {}", e)))?;
                    Ok::<(), MyError>(())
                }
            },
        )
        .boxed(),
    );

    futures::future::try_join_all(futures).await?;

    info!("All startup checks passed.");

    Ok(())
}
