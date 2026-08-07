# 0003-23 Restrict Delete Field Button to Edit View Specification

**State**: Complete

## Source PRD
[PRD 0003 - Core Domain: Users, Farms & Fields](../../prds/0003-core-domain-users-farms-fields.md) — Field Management (Field Deletion)

## Scope
This specification defines the UX requirement for placing the Delete Field button and confirmation dialog strictly inside the Edit Field view/modal container on the Field Details page (`/fields/:fieldId`).

## Requirements

### 1. Delete Field Button Location & Placement
- The Delete Field button (`id="delete-field-btn"`, `data-testid="delete-field-btn"`) must NOT be visible on the main page layout of `FieldViewComponent`.
- The Delete Field button must be located inside the Edit Field form/modal container (`id="edit-field-modal"`).
- The Delete Field button must be placed directly to the left of the Cancel button in the action bar of the edit field form (`[Delete Field] [Cancel] [Save Changes]`).

### 2. State Reset
- Closing the Edit Field view/modal (`closeEditFieldModal()`) must reset `showDeleteConfirm` to `false` to ensure the confirmation panel is hidden when reopening the edit view.

### 3. Deletion Behavior
- Clicking the Delete Field button toggles the inline confirmation panel (`id="delete-confirm-panel"`, `data-testid="delete-confirm-panel"`).

---

## Acceptance Criteria
- [x] Delete field button is absent from the main view of `/fields/:fieldId`.
- [x] Delete field button is rendered inside `#edit-field-modal` to the left of the Cancel button.
- [x] Closing the edit form resets `showDeleteConfirm = false`.
