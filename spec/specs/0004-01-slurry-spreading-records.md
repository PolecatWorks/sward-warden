# 0004-01 Slurry Spreading Records Specification

**State**: Open

## Scope
This specification covers the record-keeping capabilities required to maintain compliance with the Nutrients Action Programme (NAP) regulations concerning the spreading of slurry, as outlined in PRD 0004.

## Features

1. **General Farm Records**
   - System support to log and store general farm records annually (by 30 June).
   - Data points include: land controller identity, agricultural area, field sizes, locations, cropping regimes.
   - Record livestock details (numbers, species, time kept), manure storage capacity, and off-farm rental storage agreements.
   - Records must be stored securely and retained for a minimum of five years.

2. **Fertiliser Application Records**
   - Ability to record the type and amount of nitrogen fertiliser applied.
   - Include calculations or inputs for nitrogen content of organic manures.
   - Store evidence of grazing rights on common land or control of agricultural areas.

3. **Fertilisation Plan**
   - Capability to generate, edit, and store a written fertilisation plan.
   - Plan availability deadline management (by 1 March annually for applicable farms).
   - Applicability flags for: approved nitrates derogation, application of chemical phosphorus fertiliser to grassland, high-phosphorus manures, or anaerobic digestate.

4. **Fertilisation Account**
   - Support for generating the annual fertilisation account.
   - Relevant for farms operating under approved derogations (up to 250 kg N/ha/year).
   - Functionality to prepare data for online submission to NIEA by 1 March.

5. **Import and Export Records**
   - Logging mechanisms for moving slurry onto or off the farm.
   - Required fields: quantity, date, organic manure type, names/addresses of consignee, consignor, and transporter.
   - Document management for written contractual agreements specifying parties, origin, final destination, volume, and length of contract.
   - Alerting/reporting for export records submission by 31 January (or 1 March for derogated farms).

6. **Soil Analysis Results**
   - Upload and storage of soil analysis test results.
   - Validation integration: enforce available test results prior to the application of P-rich organic manures (>0.25 kg total P per 1 kg total N) or anaerobic digestate to prove crop requirements.

7. **Spreading Equipment Exemptions**
   - Logging functionality for specific spreading equipment usage.
   - Field for exemption reasons (e.g., using an inverted splash plate due to field slope where LESSE is otherwise required).

## Data Model Requirements
- Entities for `FarmRecords`, `FertiliserApplications`, `FertilisationPlans`, `SlurryMovements` (Import/Export), and `SoilAnalyses`.
- Ensure appropriate foreign key relations to `Farms` and `Fields` defined in `0003-01-user-profile-and-farms.md`.
- Status flags and timestamping to support compliance audits and five-year retention policies.