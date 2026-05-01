# 0008-01 Optimization Engine Core Specification

**State**: Complete

## Scope
This specification details the be implementation for the core Optimization Engine as derived from PRD 0008.

## Requirements

### Nutrient Calculation
- Implement logic to calculate optimal sward and organic manure application rates.
- Inputs must include:
  - Specific crop nutrient requirements (based on crop type and expected yield).
  - Most recent soil analysis results (Nitrogen, Phosphorus, Potassium indices).
  - Standard or tested nutrient content of the specific organic manure being applied.
- Output: Recommended application rate (e.g., $m^3$/ha) to meet crop needs without exceeding regulatory limits or causing nutrient loss.

### Strategic Planning
- Develop an algorithm to rank and suggest fields for application.
- Prioritization factors:
  - Maximum nutrient uptake potential (crop growth stage).
  - Minimization of environmental runoff risk (topology, proximity to waterways).
  - Time since last application.
  - Current weather forecast window.

## Technical Details
- Must be implemented in the Rust be (`sw-be-container`).
- Create a new module (e.g., `src/optimization/`) to house calculation and ranking logic.
- Expose REST API endpoints (e.g., `GET /v0/optimization/suggestions/{farm_id}`) to provide calculated plans and reasoning to the fe.
- Utilize existing PostgreSQL tables for soil data, crop data, and field geometry.
- Define specific response structures for "Suggested Plans", including calculated rates and human-readable "Reasoning" strings.
