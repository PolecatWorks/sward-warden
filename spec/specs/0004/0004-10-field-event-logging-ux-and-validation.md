# Technical Specification 0019-01: Field Event Logging UX and Validation

**State**: Complete

## Scope
This specification details the frontend component changes required to implement form validation, visual error highlighting, the Planting form modal, and the general Event selector modal on the Field details page.

## Required UI Forms & Validations

For each form, the **Save Record** button must be disabled (`[disabled]="!formRef.valid"`) until all validation constraints are satisfied. Form fields must be visually highlighted using a red border (`border-error ring-1 ring-error`) when the field is invalid and has either been touched or the form has been submitted.

### 1. Fertiliser Application Form
- **Template Reference**: `#fertForm="ngForm"`
- **Fields & Constraints**:
  - `Date` (`required`)
  - `Fertiliser Type` (`required`)
  - `Amount Applied` (`required`, `min="1"`)
  - `Buffer Zone Confirmed` (`required` checkbox - must be checked)
- **Save Button**: `[disabled]="!fertForm.valid"`

### 2. Spraying Record Form
- **Template Reference**: `#sprayForm="ngForm"`
- **Fields & Constraints**:
  - `Date` (`required`)
  - `Product MAPP Number` (`required`)
  - `EPPO Code` (`required`)
  - `BBCH Stage` (`required`)
- **Save Button**: `[disabled]="!sprayForm.valid"`

### 3. Organic Manure Form
- **Template Reference**: `#manureForm="ngForm"`
- **Fields & Constraints**:
  - `Date` (`required`)
  - `Manure Type` (`required`)
  - `Confirm Soil/Weather Conditions` (`required` checkbox - must be checked)
  - `Equipment Used` (required *only if* `is_lesse_applied` is false/unchecked)
  - `LESSE Exemption Reason` (required *only if* `is_lesse_applied` is false/unchecked)
- **Save Button**: `[disabled]="!manureForm.valid"`

### 4. Planting Form (New Modal)
- **Template Reference**: `#plantingForm="ngForm"`
- **Fields & Constraints**:
  - `Date` (`required`)
  - `Crop Type` (`required`, e.g., Barley, Wheat)
  - `Variety` (`required`, e.g., Spring Barley '24)
  - `Description / Notes` (optional)
- **Save Button**: `[disabled]="!plantingForm.valid"`

### 5. General Event Form (New Selector Modal)
- **Template Reference**: `#generalForm="ngForm"`
- **Fields & Constraints**:
  - `Event Type` (`required` dropdown)
    - Options: `Planting`, `Fertiliser`, `Spraying`, `Organic Manure`, `Harvesting`, `Tilling`, `Other`
  - If type is `Harvesting`, `Tilling`, or `Other`:
    - `Date` (`required`)
    - `Description / Notes` (`required`)
- **Routing**: If type is `Planting`, `Fertiliser`, `Spraying`, or `Organic Manure`, the general modal closes, and the corresponding specific modal is displayed.
- **Save Button**: `[disabled]="!generalForm.valid"`

---

## Verification Plan

### Automated Tests
- Run front-end unit tests using:
  ```bash
  make sw-fe-test
  ```

### Manual Verification
- Navigate to a Field Details page.
- Verify clicking each button (Planting, Fertiliser, Spraying, Organic Manure) opens the correct modal.
- Verify the Save button is disabled initially.
- Verify entering invalid details triggers a red highlighted border.
- Verify that entering valid details enables the Save button, and records are successfully logged on submit.
- Verify clicking the main "Record Event" button opens the General selector modal.
- Verify selecting "Planting" in the selector redirects to the Planting form.
