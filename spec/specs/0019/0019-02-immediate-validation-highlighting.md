# Technical Specification 0019-02: Immediate Validation Highlighting

**State**: Complete

## Scope
This specification details the visual highlighting changes required in the field event forms (Fertiliser, Spraying, Organic Manure, Planting, and General Event) to ensure that invalid required fields are immediately styled with a red border (`border-error ring-1 ring-error`) and display error text as soon as the form modal or section is opened/rendered, rather than waiting for the field to be touched/dirty or the form to be submitted.

## Proposed Changes

### Frontend Event Forms UI Highlights
For each required field in the event forms on the Field view, the validation highlight class `border-error ring-1 ring-error focus:ring-error` and the corresponding error message span must be evaluated against the input's current model state or validity immediately upon rendering:

1. **Fertiliser Form**:
   - **Date**: Red highlight if `!newFertiliser.date` or the control is invalid.
   - **Type**: Red highlight if `!newFertiliser.fertiliser_type` or the control is invalid.
   - **Amount**: Red highlight if `!newFertiliser.amount_applied` or value is `< 1` or the control is invalid.
   - **Buffer Zone Checkbox**: Red highlight label if `!newFertiliser.buffer_zone_confirmed` or the control is invalid.

2. **Spraying Form**:
   - **Date**: Red highlight if `!newSpraying.date` or the control is invalid.
   - **MAPP Number**: Red highlight if `!newSpraying.mapp_number` or the control is invalid.
   - **EPPO Code**: Red highlight if `!newSpraying.eppo_code` or the control is invalid.
   - **BBCH Stage**: Red highlight if `!newSpraying.bbch_growth_stage` or the control is invalid.

3. **Organic Manure Form**:
   - **Date**: Red highlight if `!newOrganicManure.date` or the control is invalid.
   - **Type**: Red highlight if `!newOrganicManure.manure_type` or the control is invalid.
   - **Conditions Checkbox**: Red highlight label if `!newOrganicManure.weather_conditions_confirmed` or the control is invalid.
   - **Equipment Used**: Red highlight if low-emission equipment is unchecked AND equipment is empty or invalid.
   - **Exemption Reason**: Red highlight if low-emission equipment is unchecked AND exemption reason is empty or invalid.

4. **Planting Form**:
   - **Date**: Red highlight if `!newPlanting.date` or the control is invalid.
   - **Crop Type**: Red highlight if `!newPlanting.crop` or the control is invalid.
   - **Variety**: Red highlight if `!newPlanting.variety` or the control is invalid.

5. **General Event Form**:
   - **Type**: Red highlight if `!generalEvent.event_type` or the control is invalid.
   - **Date**: Red highlight if `!generalEvent.date` or the control is invalid.
   - **Description**: Red highlight if event type requires description (Harvesting, Tilling, Other) AND description is empty or invalid.

---

## Verification Plan

### Automated Tests
- Run front-end unit tests using:
  ```bash
  make sw-fe-test
  ```
- Run integration/e2e tests using:
  ```bash
  make robot-test
  ```

### Manual Verification
- Open each field event modal (Fertiliser, Spraying, Organic Manure, Planting, General Event).
- Verify that required empty fields are immediately highlighted in red and display their error message spans when the modal is opened.
- Verify that entering a valid value resolves the red highlights instantly.
