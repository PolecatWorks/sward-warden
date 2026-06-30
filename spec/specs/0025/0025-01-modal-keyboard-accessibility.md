# Specification 0025-01: Modal Keyboard Accessibility

## Overview
This document specifies the technical implementation details for adding keyboard accessibility to modals in the Sward Warden frontend application (`sw-fe-container`), fulfilling the requirements of PRD 0025. It also resolves the ambiguity around "dirty state" for "Add" vs "Edit" modals.

## Requirements Clarification

1. **Cancel via Escape Key (`Esc`)**: All modals and modal-like overlays (including inline editing overlays) must listen for the `Escape` key globally or locally to dismiss the modal and discard any unsaved changes.
2. **Submit via Return/Enter Key (`Enter`)**: Input fields within modals must trigger the form's submit action when the `Enter` key is pressed.
3. **Disabled Submit Button**:
   - **Edit Modals**: The submit button must remain disabled unless a valid change has been made. This requires a "dirty state" comparison against the original values.
   - **Add Modals**: The submit button must remain disabled until the form is in a valid state (i.e., all necessary and required fields are filled).

## Implementation Details

### 1. HostListener for Escape Key
Each component containing a modal will use `@HostListener('document:keydown.escape', ['$event'])` to listen for the `Esc` key and call the respective cancellation/close methods (e.g., `closeModal()`, `cancelEdit()`).

### 2. Enter Key Submission
Input fields inside modals will be bound with Angular's `(keydown.enter)` event, triggering the submit method (e.g., `(keydown.enter)="saveChanges()"`). The submit method itself must verify the form is valid and/or dirty before proceeding, identical to the check on the Submit button's `[disabled]` attribute.

### 3. Dirty State and Validation
- **Edit Modals**: We will introduce `originalEditX` variables to store the initial state of the fields. A `hasEditChanges()` function will compare the current `editX` variables against their `originalEditX` counterparts. The submit button will include `[disabled]="!isValid() || !hasEditChanges()"`.
- **Add Modals**: The submit button will include `[disabled]="!isValid()"` to ensure required inputs (like Name, Location, or Area) are provided.

### Targeted Components
- `UserProfileComponent`: Edit Profile Modal.
- `FarmsComponent`: Add Farm Modal, Edit Farm (inline modal).
- `FarmDetailComponent`: Edit Farm Modal.
- `FieldsComponent`: Add Field Modal, Edit Field (inline modal).
- `FieldViewComponent`: Edit Field Modal.

All targeted components will be reviewed to ensure strict compliance with these three accessibility guidelines.
