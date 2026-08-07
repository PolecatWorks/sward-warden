# 0003-22 Restrict Delete Farm Button to Edit View Specification

**State**: Complete

## Source PRD
[PRD 0003 - Core Domain: Users, Farms & Fields](../../prds/0003-core-domain-users-farms-fields.md) — Farm Management (Safe Deletion)

## Scope
This specification defines the UX requirement for placing the Delete Farm button and confirmation dialog strictly inside the Edit Farm view/modal container on the Farm Details page (`/farms/:farmId`).

## Requirements

### 1. Delete Farm Button Location
- The Delete Farm button (`id="delete-farm-btn"`, `data-testid="delete-farm-btn"`) and its hover tooltip (`id="delete-farm-warning"`, `data-testid="delete-farm-warning"`) must NOT be visible on the main page layout of `FarmDetailComponent`.
- The Delete Farm button must be located inside the Edit Farm form/modal container (`id="edit-farm-modal"`).

### 2. State Reset
- Closing the Edit Farm view/modal (`closeEditFarmModal()`) must reset `showDeleteConfirm` to `false` to ensure the confirmation panel is hidden when reopening the edit view.

### 3. Deletion Behavior
- The button remains disabled if active fields (`fields.length > 0`) are associated with the farm.
- Clicking the button when active fields count is 0 toggles the inline confirmation panel (`id="delete-confirm-panel"`, `data-testid="delete-confirm-panel"`).

---

## Acceptance Criteria
- [x] Delete farm button is absent from the main view of `/farms/:farmId`.
- [x] Delete farm button is rendered inside `#edit-farm-modal`.
- [x] Closing the edit form resets `showDeleteConfirm = false`.
