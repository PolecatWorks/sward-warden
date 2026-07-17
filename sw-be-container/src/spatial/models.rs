use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Waterway {
    pub id: Option<i64>,
    pub name: Option<String>,
    pub waterway_type: String,
    pub geom: String, // WKT or GeoJSON
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BufferZone {
    pub waterway_id: i64,
    pub distance_meters: f64,
    pub geom: String,
}
