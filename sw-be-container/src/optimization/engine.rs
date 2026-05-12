use crate::error::AppError;
use crate::models::Field;
use crate::optimization::models::{OptimizationPlan, OptimizationSuggestion};
use sqlx::PgPool;

pub struct OptimizationEngine;

impl OptimizationEngine {
    pub async fn get_suggestions(
        pool: &PgPool,
        farm_id: i64,
    ) -> Result<OptimizationPlan, AppError> {
        // 1. Fetch all fields for the farm
        let fields = sqlx::query_as::<_, Field>(
            "SELECT * FROM fields WHERE farm_id = $1 AND is_deleted = FALSE",
        )
        .bind(farm_id)
        .fetch_all(pool)
        .await?;

        let mut suggestions = Vec::new();

        for field in fields {
            let mut score: f64 = 0.5;
            let mut recommended_rate = 30.0;
            let mut reasoning = "Standard maintenance rate.".to_string();

            if let Some(ref land_use) = field.land_use
                && land_use.to_lowercase().contains("grass") {
                    score += 0.2;
                    recommended_rate = 40.0;
                    reasoning = "High uptake potential for grass crop.".to_string();
                }

            // Simplified: ignore soil test date for now as it's not in the Field model
            score += 0.1;

            suggestions.push(OptimizationSuggestion {
                field_id: field.id.unwrap(),
                field_name: field.name,
                recommended_rate,
                unit: "m3/ha".to_string(),
                nutrient_met: "Nitrogen".to_string(),
                score: score.clamp(0.0, 1.0),
                reasoning,
            });
        }

        // Sort suggestions by score descending
        suggestions.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        Ok(OptimizationPlan {
            farm_id,
            suggestions,
        })
    }
}
