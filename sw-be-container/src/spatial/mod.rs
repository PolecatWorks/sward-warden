//! Spatial analysis and GIS services.

pub mod models;
pub mod service;

pub use models::{BufferZone, Waterway};
pub use service::SpatialService;
