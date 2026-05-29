use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Support,
    Admin,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub email: String,
    pub role: Role,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct Farm {
    pub id: Option<i64>,
    pub user_id: Option<i64>,
    pub name: String,
    pub location: String,
    pub has_derogation: Option<bool>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct Field {
    pub id: Option<i64>,
    pub farm_id: i64,
    pub name: String,
    pub area_hectares: f64,
    pub land_use: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct Event {
    pub id: Option<i64>,
    pub field_id: i64,
    pub event_type: String,
    pub description: String,
    pub date: String,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
    pub mapp_number: Option<String>,
    pub eppo_code: Option<String>,
    pub bbch_growth_stage: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct FarmRecord {
    pub id: Option<i64>,
    pub farm_id: Option<i64>,
    pub agricultural_area: f64,
    pub manure_storage_capacity: f64,
    pub year: i32,
    pub has_derogation: Option<bool>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

/// Response structure for the delta sync endpoint.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SyncResponse {
    pub checkpoint: DateTime<Utc>,
    pub farms: Vec<Farm>,
    pub fields: Vec<Field>,
    pub events: Vec<Event>,
    pub farm_records: Vec<FarmRecord>,
    pub soil_analyses: Vec<SoilAnalysis>,
    pub fertilisation_plans: Vec<FertilisationPlan>,
    pub fertiliser_applications: Vec<FertiliserApplication>,
    pub organic_manure_applications: Vec<OrganicManureApplication>,
    pub compliance_breaches: Vec<ComplianceBreach>,
    pub sward_movements: Vec<SwardMovement>,
}

/// Query parameters for the delta sync endpoint.
#[derive(Deserialize, Debug)]
pub struct SyncQuery {
    pub since: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct SoilAnalysis {
    pub id: Option<i64>,
    pub field_id: i64,
    pub sample_date: String,
    pub ph_level: Option<f64>,
    pub phosphorus_index: Option<i32>,
    pub potassium_index: Option<i32>,
    pub magnesium_index: Option<i32>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct FertilisationPlan {
    pub id: Option<i64>,
    pub field_id: i64,
    pub crop_type: String,
    pub target_yield: f64,
    pub nitrogen_requirement: f64,
    pub phosphorus_requirement: f64,
    pub potassium_requirement: f64,
    pub application_date: String,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct FertiliserApplication {
    pub id: Option<i64>,
    pub event_id: i64,
    pub fertiliser_type: String,
    pub amount_applied: f64,
    pub nitrogen_content: Option<f64>,
    pub phosphorus_content: Option<f64>,
    pub is_protected_urea: Option<bool>,
    pub buffer_zone_confirmed: Option<bool>,
    pub evidence_of_control: Option<String>,
    #[sqlx(default)]
    pub geometry_wkt: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct OrganicManureApplication {
    pub id: Option<i64>,
    pub event_id: i64,
    pub manure_type: String,
    pub volume_applied_m3_per_ha: Option<f64>,
    pub weight_applied_tonnes_per_ha: Option<f64>,
    pub nitrogen_content_kg_per_unit: Option<f64>,
    pub is_lesse_applied: Option<bool>,
    pub weather_conditions_confirmed: Option<bool>,
    pub buffer_zone_distance_meters: Option<i64>,
    pub equipment_used: Option<String>,
    pub lesse_exemption_reason: Option<String>,
    #[sqlx(default)]
    pub geometry_wkt: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct ComplianceBreach {
    pub id: Option<i64>,
    pub farm_id: i64,
    pub breach_type: String,
    pub severity: String,
    pub estimated_penalty_percentage: Option<f64>,
    pub mandatory_training_required: Option<String>,
    pub breach_date: String,
    pub notes: Option<String>,
    pub is_repeat: Option<bool>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct SwardMovement {
    pub id: Option<i64>,
    pub farm_id: i64,
    pub movement_type: String, // 'import' or 'export'
    pub quantity_m3: f64,
    pub date: String,
    pub manure_type: String,
    pub consignee_name: Option<String>,
    pub consignee_address: Option<String>,
    pub consignor_name: Option<String>,
    pub consignor_address: Option<String>,
    pub transporter_name: Option<String>,
    pub contract_length_months: Option<i32>,
    pub updated_at: Option<DateTime<Utc>>,
    pub is_deleted: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow)]
pub struct AuditLog {
    pub id: i32,
    pub user_id: Option<i64>,
    pub action: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<i64>,
    pub details: Option<String>,
    pub created_at: DateTime<Utc>,
}
