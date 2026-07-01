# 0003-04 Event Tracking Specification

**State**: Complete

## Scope
This specification covers the implementation details of event tracking as outlined in PRD 0003.

## Features
- Record events for each field, supporting the following core types and metadata payloads:
  - **Planting**:
    - Metadata: `crop_type` (VARCHAR), `crop_variety` (VARCHAR), `seeding_rate_kg_ha` (NUMERIC)
  - **Fertiliser Application**:
    - Metadata: `product_name` (VARCHAR), `quantity_kg_ha` (NUMERIC), `n_percentage` (NUMERIC), `p_percentage` (NUMERIC), `k_percentage` (NUMERIC)
  - **Sward (Slurry / Manure) Application**:
    - Metadata: `quantity_m3_ha` (NUMERIC), `application_method` (ENUM: `LESSE`, `SplashPlate`), `nitrogen_loading_kg_ha` (NUMERIC)
  - **Spraying (Pesticides)**:
    - Metadata: `mapp_code` (VARCHAR), `eppo_code` (VARCHAR), `bbch_growth_stage` (INTEGER), `product_name` (VARCHAR), `application_rate_l_ha` (NUMERIC)
  - **Harvesting**:
    - Metadata: `yield_tonnes_ha` (NUMERIC), `dry_matter_percentage` (NUMERIC)
  - **Tilling**:
    - Metadata: `tilling_method` (ENUM: `Ploughing`, `MinTill`, `NoTill`, `Subsoiling`)
  - **Soil Analysis**:
    - Metadata: `ph_level` (NUMERIC), `p_index` (INTEGER), `k_index` (INTEGER), `organic_matter_percentage` (NUMERIC), `analysis_date` (DATE)
  - **Other**:
    - Metadata: General JSONB payload for custom attributes.

## Data Model Requirements
- Create `Events` entity:
  - `id` (UUID, Primary Key)
  - `field_id` (UUID, Foreign Key referencing `Fields.id`)
  - `event_type` (VARCHAR / ENUM matching types above)
  - `event_date` (DATE)
  - `metadata` (JSONB) - Houses the type-specific payloads outlined above.
- Support relationship for Many Events per Field.
