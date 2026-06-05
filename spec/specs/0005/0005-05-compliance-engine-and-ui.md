# Specification 0005-05: Compliance Engine Rules and UI Components

**State**: Complete

## 1. Overview
This specification details the business logic rules and calculations for the Farm Sustainability Standards (FSS) compliance engine, including livestock manure storage capacity, nitrogen limits, derogations, training tracking, and front-end compliance warning visualizers.

## 2. Compliance Logic & Calculations
- **Manure Storage Capacity Enforcement**:
  - The compliance engine must compare the farm's active storage capacity (`StorageCapacity` in inventory) against the calculated livestock manure production over winter periods:
    - **26 Weeks**: Required for pig and poultry enterprises.
    - **22 Weeks**: Required for all other livestock types (e.g., cattle, sheep).
  - The check must trigger a warning status if `total_storage_capacity_m3` is less than `calculated_production_m3`.
- **Grassland Nitrogen Limits**:
  - Enforce the standard N limit of **170 kg N/ha/year** across the farm's total agricultural area.
  - **Derogated Farms**:
    - Allow up to **250 kg N/ha/year** if the farm has an active, approved Nitrates Derogation status.
    - Validate that at least **80%** of the farm's net agricultural area is maintained in grassland.
    - Validate that a detailed Phosphorus balance sheet is submitted.
- **Dry Matter Yield Calculations**:
  - Incorporate field crop nitrogen requirements based on expected dry matter yield to alert the user if a fertilization event exceeds crop requirements.

## 3. Training & Audit Tracking
- **Mandatory Training Tracking**:
  - DB schema must track mandatory sustainability and fertilizer training records for farm operators:
    - Table `operator_training`: `id`, `user_id`, `course_name`, `provider`, `completion_date`, `expiry_date`, `certificate_ref`.
- **Rolling 3-Year Repeat Breaches**:
  - When calculating compliance penalties (using the Penalty Matrix defined in `0005-04`), the engine must query historical breaches for the farm over a rolling **3-year window**.
  - Escalation Rule: First breach uses base penalty %; a second breach of the same regulation within 3 years doubles the penalty; a third breach results in maximum statutory deduction.

## 4. Compliance UI/UX Features
- **High-Visibility Alert Banner**:
  - Positioned at the top of the main Dashboard. Uses `warning` or `error` icons from `Material Symbols Outlined` to highlight active compliance risks (e.g., "Nitrogen limit exceeded on Field 3", "Manure storage capacity below 22-week minimum").
- **Bento Grid Regulation Visualization**:
  - The compliance center dashboard must use bento modules:
    - **Card A (Nitrogen Limit Gauge)**: Circular progress bar showing N applied vs limit.
    - **Card B (Storage Gauge)**: Winter storage capacity status.
    - **Card C (Training Status)**: Operator training validity indicators.
- **Vulnerable Zones Map Layer**:
  - On the GIS map view, highlight regulatory vulnerable zones (e.g., Nitrates Vulnerable Zones, drinking water abstraction zones, watercourse buffers).
  - Visual alert overlays when a user plots or schedules a spreading event that intersects with these buffer zones.
