use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct Farm {
    pub id: Option<i64>,
    pub user_id: Option<i64>,
    pub name: String,
    pub location: String,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct Field {
    pub id: Option<i64>,
    pub farm_id: i64,
    pub name: String,
    pub area_hectares: f64,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct Event {
    pub id: Option<i64>,
    pub field_id: i64,
    pub event_type: String,
    pub description: String,
    pub date: String,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct FarmRecord {
    pub id: Option<i64>,
    pub farm_id: i64,
    pub agricultural_area: f64,
    pub manure_storage_capacity: f64,
    pub year: i32,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

/// Response structure for the delta sync endpoint.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SyncResponse {
    pub checkpoint: DateTime<Utc>,
    pub farms: Vec<Farm>,
    pub fields: Vec<Field>,
    pub events: Vec<Event>,
    pub farm_records: Vec<FarmRecord>,
}

/// Query parameters for the delta sync endpoint.
#[derive(Deserialize, Debug)]
pub struct SyncQuery {
    pub since: Option<DateTime<Utc>>,
}
