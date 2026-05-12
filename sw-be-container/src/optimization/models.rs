use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OptimizationSuggestion {
    pub field_id: i64,
    pub field_name: String,
    pub recommended_rate: f64,
    pub unit: String,
    pub nutrient_met: String, // e.g., "Nitrogen"
    pub score: f64,           // 0.0 to 1.0 ranking
    pub reasoning: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OptimizationPlan {
    pub farm_id: i64,
    pub suggestions: Vec<OptimizationSuggestion>,
}
