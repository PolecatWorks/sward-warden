//! Nutrient spreading optimization engine and recommendation algorithms.

pub mod engine;
pub mod models;

pub use engine::OptimizationEngine;
pub use models::{OptimizationPlan, OptimizationSuggestion};
