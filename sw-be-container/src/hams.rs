use futures::future;
use reqwest::Client;
use serde::Deserialize;
use serde_with::DurationSeconds;
use serde_with::serde_as;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{error, info};

use url::Url;

use crate::error::AppError;

#[serde_as]
#[derive(Deserialize, Debug, Clone)]
pub struct Checks {
    #[serde_as(as = "DurationSeconds<u64>")]
    pub timeout: Duration,
    pub fails: u32,
    pub preflights: Vec<Url>,
    pub shutdowns: Vec<Url>,
}

impl Checks {
    pub async fn preflight(&self, client: &Client) -> Result<u32, AppError> {
        let futures = self.preflights.iter().map(|preflight| async move {
            let mut fails = self.fails;
            info!("Checking preflight: {}", preflight);
            while fails > 0 && client.get(preflight.clone()).send().await.is_err() {
                info!(
                    "Failed preflight: {} retrying in {} secs (fail count {}/{})",
                    preflight,
                    self.timeout.as_secs(),
                    fails,
                    self.fails
                );
                sleep(self.timeout).await;
                fails -= 1;
            }
            if fails > 0 {
                info!(
                    "Preflight success for {}, {} retries remaining",
                    preflight, fails
                );
                Ok(fails)
            } else {
                error!("Preflight FAIL for {}", preflight);
                Err(AppError::PreflightCheck)
            }
        });

        let results = future::try_join_all(futures).await?;
        let min_fails = results.into_iter().min().unwrap_or(self.fails);
        info!(
            "Overall preflight success, min {} retries remaining across targets",
            min_fails
        );
        Ok(min_fails)
    }

    pub async fn shutdown(&self, client: &Client) -> Result<u32, AppError> {
        let futures = self.shutdowns.iter().map(|shutdown| async move {
            let mut fails = self.fails;
            info!("Checking shutdown: {}", shutdown);
            while fails > 0 && client.get(shutdown.clone()).send().await.is_err() {
                info!(
                    "Failed shutdown: {} retrying in {} secs (fail count {}/{})",
                    shutdown,
                    self.timeout.as_secs(),
                    fails,
                    self.fails
                );
                sleep(self.timeout).await;
                fails -= 1;
            }
            if fails > 0 {
                info!(
                    "Shutdown success for {}, {} retries remaining",
                    shutdown, fails
                );
                Ok(fails)
            } else {
                error!("Shutdown FAIL for {}", shutdown);
                Err(AppError::ShutdownCheck)
            }
        });

        let results = future::join_all(futures).await;

        let mut min_fails = self.fails;
        let mut any_failed = false;

        for result in results {
            match result {
                Ok(fails) => {
                    min_fails = min_fails.min(fails);
                }
                Err(_) => {
                    any_failed = true;
                }
            }
        }

        if any_failed {
            Err(AppError::ShutdownCheck)
        } else {
            info!(
                "Overall shutdown success, min {} retries remaining across targets",
                min_fails
            );
            Ok(min_fails)
        }
    }
}
