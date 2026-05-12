#[cfg(test)]
mod tests {
    use crate::models::{Event, Farm, Field, OrganicManureApplication};
    use crate::rules::{ValidationResult, validate_organic_manure_application};


    fn get_test_farm() -> Farm {
        Farm {
            id: Some(1),
            user_id: Some(1),
            name: "Test Farm".to_string(),
            location: "Test Location".to_string(),
            has_derogation: Some(false),
            updated_at: None,
            is_deleted: Some(false),
        }
    }

    fn get_test_field() -> Field {
        Field {
            id: Some(1),
            farm_id: 1,
            name: "Test Field".to_string(),
            area_hectares: 10.0,
            land_use: Some("grassland".to_string()),
            updated_at: None,
            is_deleted: Some(false),
        }
    }

    #[test]
    fn test_validate_organic_manure_lesse_required_pig_slurry() {
        let farm = get_test_farm();
        let field = get_test_field();
        let event = Event {
            id: Some(1),
            field_id: 1,
            event_type: "Slurry Application".to_string(),
            description: "Test".to_string(),
            date: "2024-05-01".to_string(),
            updated_at: None,
            is_deleted: Some(false),
            mapp_number: None,
            eppo_code: None,
            bbch_growth_stage: None,
        };
        let app = OrganicManureApplication {
            id: None,
            event_id: 1,
            manure_type: "Pig Slurry".to_string(),
            volume_applied_m3_per_ha: Some(20.0),
            weight_applied_tonnes_per_ha: None,
            nitrogen_content_kg_per_unit: Some(5.0),
            is_lesse_applied: Some(false),
            weather_conditions_confirmed: Some(true),
            buffer_zone_distance_meters: Some(5),
            equipment_used: Some("Splash Plate".to_string()),
            lesse_exemption_reason: None,
            geometry_wkt: None,
            updated_at: None,
            is_deleted: Some(false),
        };

        let result = validate_organic_manure_application(&event, &app, &field, &farm, &[]);
        match result {
            ValidationResult::Invalid(reason) => assert!(reason.contains("LESSE) is required")),
            _ => panic!("Expected validation failure for missing pig slurry LESSE exemption"),
        }
    }

    #[test]
    fn test_validate_organic_manure_lesse_exemption_valid() {
        let farm = get_test_farm();
        let field = get_test_field();
        let event = Event {
            id: Some(1),
            field_id: 1,
            event_type: "Slurry Application".to_string(),
            description: "Test".to_string(),
            date: "2024-05-01".to_string(),
            updated_at: None,
            is_deleted: Some(false),
            mapp_number: None,
            eppo_code: None,
            bbch_growth_stage: None,
        };
        let app = OrganicManureApplication {
            id: None,
            event_id: 1,
            manure_type: "Pig Slurry".to_string(),
            volume_applied_m3_per_ha: Some(20.0),
            weight_applied_tonnes_per_ha: None,
            nitrogen_content_kg_per_unit: Some(5.0),
            is_lesse_applied: Some(false),
            weather_conditions_confirmed: Some(true),
            buffer_zone_distance_meters: Some(5),
            equipment_used: Some("Splash Plate".to_string()),
            lesse_exemption_reason: Some("Field slope too steep for LESSE".to_string()),
            geometry_wkt: None,
            updated_at: None,
            is_deleted: Some(false),
        };

        let result = validate_organic_manure_application(&event, &app, &field, &farm, &[]);
        assert!(matches!(result, ValidationResult::Valid));
    }

    #[test]
    fn test_validate_organic_manure_lesse_required_2026() {
        let farm = get_test_farm();
        let field = get_test_field();
        let event = Event {
            id: Some(1),
            field_id: 1,
            event_type: "Slurry Application".to_string(),
            description: "Test".to_string(),
            date: "2026-05-01".to_string(),
            updated_at: None,
            is_deleted: Some(false),
            mapp_number: None,
            eppo_code: None,
            bbch_growth_stage: None,
        };
        let app = OrganicManureApplication {
            id: None,
            event_id: 1,
            manure_type: "Cattle Slurry".to_string(),
            volume_applied_m3_per_ha: Some(20.0),
            weight_applied_tonnes_per_ha: None,
            nitrogen_content_kg_per_unit: Some(5.0),
            is_lesse_applied: Some(false),
            weather_conditions_confirmed: Some(true),
            buffer_zone_distance_meters: Some(5),
            equipment_used: Some("Splash Plate".to_string()),
            lesse_exemption_reason: None,
            geometry_wkt: None,
            updated_at: None,
            is_deleted: Some(false),
        };

        let result = validate_organic_manure_application(&event, &app, &field, &farm, &[]);
        match result {
            ValidationResult::Invalid(reason) => assert!(reason.contains("LESSE) is required")),
            _ => panic!(
                "Expected validation failure for cattle slurry in 2026 without LESSE/exemption"
            ),
        }
    }
}
