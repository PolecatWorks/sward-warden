//! Shared application state structure for Axum HTTP handlers.
//!
//! Encapsulates database connection pools, configuration options, Prometheus metrics handles,
//! mock dev-auth JWT keypairs, and thread-safe caches.

use axum_prometheus::metrics_exporter_prometheus::PrometheusHandle;
use jwt_simple::algorithms::RS256KeyPair;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config::AppConfig;
use crate::models::Farm;

/// Thread-safe shared application state passed to HTTP handlers via Axum extractors.
#[derive(Clone)]
pub struct AppState {
    /// Active application configuration parameters.
    pub config: AppConfig,
    /// Prometheus metrics exporter handle.
    pub prometheus_handle: Arc<PrometheusHandle>,
    /// PostgreSQL database connection pool handle.
    pub db_pool: sqlx::PgPool,
    /// Thread-safe cache of farm records indexed by user ID.
    pub farms_cache: Arc<RwLock<std::collections::HashMap<i64, Vec<Farm>>>>,
    /// Optional dev-mode RS256 keypair for signing local JWT tokens.
    pub dev_jwt_keypair: Option<Arc<RS256KeyPair>>,
    /// Optional dev-mode JWKS JSON response string.
    pub dev_jwks_json: Option<String>,
}

impl AppState {
    /// Constructs a new [`AppState`] instance with initialized caches.
    // References more than 3 PRDs
    pub fn new(
        config: AppConfig,
        prometheus_handle: PrometheusHandle,
        db_pool: sqlx::PgPool,
        dev_jwt_keypair: Option<Arc<RS256KeyPair>>,
        dev_jwks_json: Option<String>,
    ) -> Self {
        Self {
            config,
            prometheus_handle: Arc::new(prometheus_handle),
            db_pool,
            farms_cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
            dev_jwt_keypair,
            dev_jwks_json,
        }
    }
}
