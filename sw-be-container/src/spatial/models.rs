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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExtentsRequest {
    pub geometries: Vec<geojson::Geometry>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Extents {
    pub min_x: f64,
    pub max_x: f64,
    pub min_y: f64,
    pub max_y: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExtentsResponse {
    pub center: Point,
    pub extents: Extents,
}

#[derive(Serialize, Deserialize, Clone, Debug, sqlx::FromRow)]
pub struct OfficialBoundary {
    pub id: Option<i64>,
    pub sbi: String,
    pub parcel_id: String,
    pub geometry_geojson: String,
    pub source: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OfficialBoundaryApiResponse {
    pub sbi: String,
    pub parcel_id: String,
    pub polygon_geojson: String,
}
