//! Weather integration and spreading suitability forecasting services.

pub mod data;
pub mod service;

pub use data::WeatherData;
pub use service::WeatherService;

#[cfg(test)]
mod tests;
