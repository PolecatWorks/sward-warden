# Specification 0016-03: Fields-First UX Enhancements

**State**: Complete

## 1. Overview
This specification details the frontend UX improvements for the fields-first experience and backend auto-farm creation for beginner users.

## 2. Requirements

- **REQ-5 (Navigation Order)**: Swap "Fields" and "Farms" in the desktop sidebar and mobile navigation menu. "Fields" must be placed before "Farms" (order: Dashboard, Fields, Farms, Compliance, Profile).
- **REQ-6 (Empty States)**: Display a prominent center-aligned empty state card with an icon, welcoming description, and an "Add Field" / "Add Farm" button when the respective lists are empty.
- **REQ-7 (Unified Add Action Layout)**: Update the "Add Field" action on the fields page to use a bottom-right FAB button and a modal dialog, matching the styling, size, and layout position of the "Add Farm" action on the farms page.
- **REQ-8 (Auto-Farm Creation)**: If a user has no farms in the system and creates a field, the backend must automatically create a farm named `"My Farm"` (with location `"Default Location"`) and assign the new field to it.
- **REQ-9 (Field Deletion Flow)**: Remove the delete button from the fields list view. Field deletion is only available inside the field detail view (`/fields/:fieldId`), and when clicked, must show an inline "Are you sure?" confirmation panel directly below.

## 3. Changes

- **`sw-fe-container/src/app/main-layout/main-layout.component.html`**: Swapped route navigation links.
- **`sw-fe-container/src/app/home/fields/fields.component.html`**:
  - Removed delete button from field cards.
  - Added FAB button `#add-field-fab` (data-testid `add-field-fab`).
  - Added empty state card with `#add-field-empty-btn`.
  - Converted the inline add form to a dialog modal `#add-field-modal`.
- **`sw-fe-container/src/app/home/farms/farms.component.html`**:
  - Added empty state card with `#add-farm-empty-btn`.
- **`sw-fe-container/src/app/home/field-view/`**:
  - Added "Danger Zone" section with a Delete button and inline confirmation panel.
- **`sw-be-container/src/webserver/fields.rs`**:
  - Automatically provisions a default `"My Farm"` when creating a field if no farms exist.
