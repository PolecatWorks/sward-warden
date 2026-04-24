use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Farm {
    pub id: u64,
    pub user_id: u64,
    pub name: String,
    pub location: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Field {
    pub id: u64,
    pub farm_id: u64,
    pub name: String,
    pub area_hectares: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Event {
    pub id: u64,
    pub field_id: u64,
    pub event_type: String, // e.g. "Planting", "Fertiliser", "Slurry", "Spraying"
    pub description: String,
    pub date: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FarmRecord {
    pub id: u64,
    pub farm_id: u64,
    pub agricultural_area: f64,
    pub manure_storage_capacity: f64,
    pub year: i32,
}
