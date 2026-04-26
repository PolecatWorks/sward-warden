use chrono::{Datelike, NaiveDate, Utc};
use crate::models::{Event, FertiliserApplication, Field, OrganicManureApplication, Farm};

pub enum ValidationResult {
    Valid,
    Invalid(String),
}

pub fn validate_fertiliser_application(
    event: &Event,
    app: &FertiliserApplication,
    field: &Field,
) -> ValidationResult {
    let date = NaiveDate::parse_from_str(&event.date, "%Y-%m-%d").unwrap_or_else(|_| NaiveDate::from_ymd_opt(2000, 1, 1).unwrap());
    let month = date.month();
    let day = date.day();

    // 1. Closed Spreading Periods Rule
    // Grassland: 15 Sept to 31 Jan (Prohibited for Chemical N/P)
    let land_use = field.land_use.as_deref().unwrap_or("grassland");
    if land_use == "grassland" {
        let is_prohibited = (month == 9 && day >= 15) || month > 9 || month == 1;
        if is_prohibited && (app.nitrogen_content.unwrap_or(0.0) > 0.0 || app.phosphorus_content.unwrap_or(0.0) > 0.0) {
            return ValidationResult::Invalid("Chemical N/P fertiliser application is prohibited on grassland between 15 Sept and 31 Jan.".to_string());
        }
    }

    // 2. Urea Limits
    // No granular urea without inhibitors after 1 Jan 2026
    if date.year() >= 2026 && app.fertiliser_type.to_lowercase().contains("urea") {
        if !app.is_protected_urea.unwrap_or(false) {
            return ValidationResult::Invalid("Granular urea without inhibitors is prohibited after 1 Jan 2026.".to_string());
        }
    }

    // 3. Buffer Zones
    if !app.buffer_zone_confirmed.unwrap_or(false) {
        return ValidationResult::Invalid("You must confirm a 2-meter buffer zone from waterways.".to_string());
    }

    ValidationResult::Valid
}

pub fn validate_organic_manure_application(
    event: &Event,
    app: &OrganicManureApplication,
    _field: &Field,
    farm: &Farm,
    previous_apps: &[Event], // Used for 3-week gap rule
) -> ValidationResult {
    let date = NaiveDate::parse_from_str(&event.date, "%Y-%m-%d").unwrap_or_else(|_| Utc::now().date_naive());
    let month = date.month();
    let day = date.day();

    // 1. Closed Spreading Periods
    let m_type = app.manure_type.to_lowercase();
    if m_type.contains("sward") || m_type.contains("poultry") || m_type.contains("digestate") {
        let is_prohibited = (month == 10 && day >= 15) || month > 10 || month == 1;
        if is_prohibited {
            return ValidationResult::Invalid(format!("{} application is prohibited between 15 Oct and 31 Jan.", app.manure_type));
        }
    } else if m_type.contains("fym") || m_type.contains("farmyard") {
        let is_prohibited = month > 10 || month == 1;
        if is_prohibited {
            return ValidationResult::Invalid("Farmyard Manure (FYM) application is prohibited between 31 Oct and 31 Jan.".to_string());
        }
    }

    // 2. Weather Conditions
    if !app.weather_conditions_confirmed.unwrap_or(false) {
        return ValidationResult::Invalid("You must confirm that soil is not waterlogged, flooded, frozen, or snow-covered.".to_string());
    }

    // 3. Volume Limits
    if let Some(vol) = app.volume_applied_m3_per_ha {
        if vol > 50.0 {
            return ValidationResult::Invalid("Maximum application volume is 50m³ per hectare.".to_string());
        }
    }
    if let Some(weight) = app.weight_applied_tonnes_per_ha {
        if weight > 50.0 {
            return ValidationResult::Invalid("Maximum application weight is 50 tonnes per hectare.".to_string());
        }
    }

    // 4. Three-week Gap
    for prev in previous_apps {
        if let Ok(prev_date) = NaiveDate::parse_from_str(&prev.date, "%Y-%m-%d") {
            let diff = date.signed_duration_since(prev_date).num_days();
            if diff.abs() < 21 {
                return ValidationResult::Invalid("A minimum three-week gap is required between applications on the same land.".to_string());
            }
        }
    }

    // 5. Nitrogen Loading (Simplified check for this application)
    let limit = if farm.has_derogation.unwrap_or(false) { 250.0 } else { 170.0 };
    if let Some(n_content) = app.nitrogen_content_kg_per_unit {
        let total_n = if let Some(vol) = app.volume_applied_m3_per_ha { vol * n_content } else if let Some(weight) = app.weight_applied_tonnes_per_ha { weight * n_content } else { 0.0 };
        if total_n > limit {
             return ValidationResult::Invalid(format!("Application exceeds Nitrogen loading limit of {} kg N/ha/year.", limit));
        }
    }

    ValidationResult::Valid
}
