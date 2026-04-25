use axum_prometheus::metrics_exporter_prometheus::PrometheusHandle;
use std::sync::Arc;

use crate::config::AppConfig;

#[derive(Clone)]
pub struct AppState {
    pub config: AppConfig,
    pub prometheus_handle: Arc<PrometheusHandle>,
    pub db_pool: sqlx::PgPool,
}

impl AppState {
    pub fn new(config: AppConfig, prometheus_handle: PrometheusHandle, db_pool: sqlx::PgPool) -> Self {
        Self {
            config,
            prometheus_handle: Arc::new(prometheus_handle),
            db_pool,
        }
    }
}
