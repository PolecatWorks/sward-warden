# Specification: Profile Pencil Edit Modal and Trashcan Deletion UI

## Status
Complete

## Source PRD
[PRD 0003 - User Profile and Farms](../../prds/0003-user-profile-and-farms.md) — Profile Edit Interaction, Farm Deletion UI, Field Deletion UI

## Overview

This specification defines two UX improvements:
1. The profile edit flow is changed from an always-visible inline form to a modal triggered by a pencil icon in the hero banner.
2. The "Danger Zone" blocks on the Farm Detail and Field Detail pages are replaced by a red trashcan icon button placed next to the existing edit pencil icon in the header.

---

## Requirements

### Profile: Pencil Icon Edit Modal

**Current behaviour**: The profile page contains an always-visible "Edit Profile" form section below the page content.

**New behaviour**:
- The "Edit Profile" form section is **removed** from the page.
- A pencil icon button (`id="edit-profile-btn"`) is added next to the user's name in the hero banner.
- Clicking this button opens an edit profile modal dialog.
- The modal contains fields for: Name, Email, Phone, Description.
- The modal uses the same visual pattern as the "Edit Farm" / "Edit Field" modals:
  - Fixed overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4`
  - Inner container: `bg-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden`
  - Header with title and close button.
  - Footer with Cancel and Save Changes buttons.
- Closing the modal (cancel or save) sets `showEditProfileModal = false`.
- On successful save, the modal closes and the hero banner name is refreshed.

### Farm Detail: Red Deletion Button and Tooltip

**Current behaviour**: A prominent "Danger Zone" card block sits at the bottom of the page with a "Delete Farm" button.

**New behaviour**:
- The "Danger Zone" block is **removed**.
- A red deletion button (`id="delete-farm-btn"`, `data-testid="delete-farm-btn"`) is placed at the bottom right of the page content, styled with red error colors and a trashcan icon.
- The button is **disabled** when there are active fields (matching the old behaviour).
- The warning message "Cannot delete farm with active fields. Please move or delete the fields first." (`id="delete-farm-warning"`, `data-testid="delete-farm-warning"`) is displayed as a hover-triggered tooltip above the disabled delete button.
- Clicking the delete button toggles the inline "Are you sure?" confirmation panel directly below/next to the button.
- The confirmation panel (`id="delete-confirm-panel"`, `data-testid="delete-confirm-panel"`) with "Yes, Delete" (`id="confirm-delete-farm-btn"`) and "Cancel" (`id="cancel-delete-farm-btn"`) buttons is preserved with the same test IDs.

### Field Detail: Red Deletion Button

**Current behaviour**: A prominent "Danger Zone" card block sits at the bottom of the field detail page with a "Delete Field" button.

**New behaviour**:
- The "Danger Zone" block is **removed**.
- A red deletion button (`id="delete-field-btn"`, `data-testid="delete-field-btn"`) is placed at the bottom right of the page content, styled with red error colors and a trashcan icon.
- Clicking the delete button toggles the inline "Are you sure?" confirmation panel directly below/next to the button.
- The confirmation panel (`id="delete-confirm-panel"`, `data-testid="delete-confirm-panel"`) with "Yes, Delete" (`id="confirm-delete-field-btn"`) and "Cancel" (`id="cancel-delete-field-btn"`) buttons is preserved with the same test IDs.

---

## Acceptance Criteria

- [ ] Profile page has no "Edit Profile" inline form section.
- [ ] A pencil icon button with `id="edit-profile-btn"` appears next to the user name in the hero.
- [ ] Clicking the pencil icon opens the edit profile modal.
- [ ] The modal allows editing name, email, phone, description and saves via the existing `onEditProfileSubmit()` method.
- [ ] Farm Detail page has no "Danger Zone" block.
- [ ] A red delete button with `id="delete-farm-btn"` and `data-testid="delete-farm-btn"` appears at the bottom right of the page content.
- [ ] The delete farm button is disabled if fields are present, and displays the "Cannot delete farm..." warning as a hover tooltip (`id="delete-farm-warning"`).
- [ ] Clicking the delete farm button reveals the inline `#delete-confirm-panel` below it.
- [ ] Field Detail page has no "Danger Zone" block.
- [ ] A red delete button with `id="delete-field-btn"` and `data-testid="delete-field-btn"` appears at the bottom right of the page content.
- [ ] Clicking the delete field button reveals the inline `#delete-confirm-panel` below it.
