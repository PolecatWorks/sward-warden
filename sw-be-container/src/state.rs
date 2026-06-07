use axum_prometheus::metrics_exporter_prometheus::PrometheusHandle;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config::AppConfig;
use crate::models::Farm;

#[derive(Clone)]
pub struct AppState {
    pub config: AppConfig,
    pub prometheus_handle: Arc<PrometheusHandle>,
    pub db_pool: sqlx::PgPool,
    pub farms_cache: Arc<RwLock<std::collections::HashMap<i64, Vec<Farm>>>>,
}

impl AppState {
    pub fn new(
        config: AppConfig,
        prometheus_handle: PrometheusHandle,
        db_pool: sqlx::PgPool,
    ) -> Self {
        Self {
            config,
            prometheus_handle: Arc::new(prometheus_handle),
            db_pool,
            farms_cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }
}
