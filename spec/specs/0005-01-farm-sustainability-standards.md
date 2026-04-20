# 0005-01 Farm Sustainability Standards Specification

**State**: Superseded

## Scope
This specification details the technical requirements for enforcing environmental and reporting standards under the Farm Sustainability Standards (FSS) effective 1 January 2026, as outlined in PRD 0005. It includes features for tracking pesticide use, chemical fertiliser applications, and organic manure spreading, along with a system to monitor and handle compliance penalty rules.

## Features

1. **Spraying (Pesticide Use) Records**
   - Implement machine-readable digital record keeping for Plant Protection Products (PPPs).
   - Require three specific fields per entry starting in transition year 2026:
     - Product authorisation number (MAPP).
     - Relevant EPPO crop or land-use code.
     - BBCH growth-stage code.
   - Capability to export/transfer records electronically to authorities (e.g., DAERA) by 2027 deadline.

2. **Chemical Fertiliser Management**
   - **Closed Spreading Periods Rule Engine**: Enforce application prohibitions for chemical nitrogen or phosphorus fertilisers to grassland between 15 September and 31 January. Allow applications to arable land only if crop requirement is demonstrated.
   - **Urea Limits**: Prevent logging of granular urea fertilisers without urease inhibitors (protected urea) after 1 January 2026.
   - **Phosphorus Constraints**: Require linked recent soil analysis proving crop requirement before permitting the logging of chemical phosphorus.
   - **Buffer Zones Validation**: Provide interface checks and validations enforcing a 2-meter buffer zone away from waterways.

3. **Slurry and Organic Manure Management**
   - **Nitrogen Loading Calculations**: Track and enforce maximum livestock manure applications (170 kg N/ha/year for standard farms; 250 kg N/ha/year for derogated farms).
   - **Closed Period Enforcement**:
     - Warn or restrict entries for slurry, poultry litter, and anaerobic digestate from 15 October to 31 January.
     - Warn or restrict entries for Farmyard Manure (FYM) from 31 October to 31 January.
   - **Weather Conditions Check**: Integrate warnings preventing spreading when soil is waterlogged, flooded, frozen, snow-covered, or if heavy rain is falling/forecast within 48 hours.
   - **Application Volume Tracking**:
     - Enforce limits: maximum 50m³ (4,500 gallons) slurry or 50 tonnes solid manure per hectare per application.
     - Enforce a minimum three-week gap between applications on the same land.
   - **Buffer Zones**: Validate 10m from waterways and 20m from lakes (expanded to 15m and 30m with 30m³ limits during specific periods).
   - **Equipment (LESSE) Validation**: Enforce Low Emission Slurry Spreading Equipment (LESSE) usage for required farm configurations (contractors, digestate users, 200+ cattle, 20,000kg+ pig nitrogen, post-June 15 derogations).

4. **Compliance Penalty Matrix Tracking**
   - Implement a monitoring mechanism for audit breaches categorized by severity: Very Low, Low, and Very High.
   - Provide visual indicators or automated warnings for potential fines/penalties up to 50% support loss.
   - Track required mandatory training corresponding to specific standard violations.
   - Log repeat breaches over a rolling 3-year period.

## Data Model Requirements
- Extend event schemas to capture specific details required for PPPs (MAPP, EPPO, BBCH).
- Models for tracking closed periods and farm enterprise properties (e.g., standard vs derogated).
- Validation layers interacting with `Events` and `Fields` ensuring applications fall within allowable dates, capacities, and distances.
- Ensure integration with `FarmRecords` to calculate correct load limits.