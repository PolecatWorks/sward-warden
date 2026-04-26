pub mod data;
pub mod service;

pub use service::WeatherService;
pub use data::WeatherData;

#[cfg(test)]
mod tests;
