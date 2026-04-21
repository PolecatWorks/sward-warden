# 0005-03 Chemical Fertiliser Management Specification

**State**: Open

## Scope
This specification covers the implementation details for Chemical Fertiliser Management under the Farm Sustainability Standards (FSS) as outlined in PRD 0005.

## Features
- **Closed Spreading Periods Rule Engine**: Enforce application prohibitions for chemical nitrogen or phosphorus fertilisers to grassland between 15 September and 31 January. Allow applications to arable land only if crop requirement is demonstrated.
- **Urea Limits**: Prevent logging of granular urea fertilisers without urease inhibitors (protected urea) after 1 January 2026.
- **Phosphorus Constraints**: Require linked recent soil analysis proving crop requirement before permitting the logging of chemical phosphorus.
- **Buffer Zones Validation**: Provide interface checks and validations enforcing a 2-meter buffer zone away from waterways.

## Data Model Requirements
- Models for tracking closed periods.
- Validation layers interacting with `Events` and `Fields`.