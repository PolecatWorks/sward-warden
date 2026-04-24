use axum_prometheus::metrics_exporter_prometheus::PrometheusHandle;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config::AppConfig;
use crate::models::{User, Farm, Field, Event, FarmRecord};

#[derive(Clone)]
pub struct AppState {
    pub config: AppConfig,
    pub prometheus_handle: Arc<PrometheusHandle>,

    // Legacy in-memory stores until DB is added
    pub users: Arc<RwLock<Vec<User>>>,
    pub farms: Arc<RwLock<Vec<Farm>>>,
    pub fields: Arc<RwLock<Vec<Field>>>,
    pub events: Arc<RwLock<Vec<Event>>>,
    pub farm_records: Arc<RwLock<Vec<FarmRecord>>>,
}

impl AppState {
    pub fn new(config: AppConfig, prometheus_handle: PrometheusHandle) -> Self {
        Self {
            config,
            prometheus_handle: Arc::new(prometheus_handle),
            users: Arc::new(RwLock::new(vec![User { id: 1, name: "John Doe".to_string(), email: "john@example.com".to_string() }])),
            farms: Arc::new(RwLock::new(vec![Farm { id: 1, user_id: 1, name: "Green Acres".to_string(), location: "Springfield".to_string() }])),
            fields: Arc::new(RwLock::new(vec![Field { id: 1, farm_id: 1, name: "North Field".to_string(), area_hectares: 10.5 }])),
            events: Arc::new(RwLock::new(vec![Event { id: 1, field_id: 1, event_type: "Slurry".to_string(), description: "Spring application".to_string(), date: "2024-04-01".to_string() }])),
            farm_records: Arc::new(RwLock::new(vec![FarmRecord { id: 1, farm_id: 1, agricultural_area: 100.0, manure_storage_capacity: 500.0, year: 2024 }])),
        }
    }
}
