# 0005-03 Sward and Organic Manure Management Specification

**State**: Complete

## Scope
This specification covers the implementation details for Sward and Organic Manure Management under the Farm Sustainability Standards (FSS) as outlined in PRD 0005.

## Features
- **Nitrogen Loading Calculations**: Track and enforce maximum livestock manure applications (170 kg N/ha/year for standard farms; 250 kg N/ha/year for derogated farms).
- **Closed Period Enforcement**:
  - Warn or restrict entries for sward, poultry litter, and anaerobic digestate from 15 October to 31 January.
  - Warn or restrict entries for Farmyard Manure (FYM) from 31 October to 31 January.
- **Weather Conditions Check**: Integrate warnings preventing spreading when soil is waterlogged, flooded, frozen, snow-covered, or if heavy rain is falling/forecast within 48 hours.
- **Application Volume Tracking**:
  - Enforce limits: maximum 50m³ (4,500 gallons) sward or 50 tonnes solid manure per hectare per application.
  - Enforce a minimum three-week gap between applications on the same land.
- **Buffer Zones**: Validate 10m from waterways and 20m from lakes (expanded to 15m and 30m with 30m³ limits during specific periods).
- **Equipment (LESSE) Validation**: Enforce Low Emission Sward Spreading Equipment (LESSE) usage for required farm configurations (contractors, digestate users, 200+ cattle, 20,000kg+ pig nitrogen, post-June 15 derogations).

## Data Model Requirements
- Integration with `FarmRecords` to calculate correct load limits.
- Validation layers interacting with `Events` and `Fields`.
