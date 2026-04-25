use chrono::{Datelike, NaiveDate};
use crate::models::{Event, FertiliserApplication, Field};

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
