# 0003-08 Field Editing Specification

**State**: Complete

## Scope
This specification covers the implementation details of editing an agricultural field's properties (specifically name and area in hectares) after it has been created, as part of Field Management in PRD 0003.

## Features
- **Backend API Endpoints**:
  - `PUT /v0/fields/{id}`: Update a field's properties (name, area, land use, farm).
- **Frontend local-first support**:
  - Extend `FarmManagementService` to support updating fields locally in RxDB and queuing a sync outbox entry.
- **Field Editing UI**:
  - Inline editing in the fields list view (`FieldsComponent` at `/farms/:farmId/fields`).
  - Editing modal/controls in the field details view (`FieldViewComponent` at `/fields/:fieldId`).

## Technical Details
- **Backend**:
  - Register the route `PUT /v0/fields/{id}` on `app_router` in `sw-be-container/src/webserver/mod.rs`.
  - Add query handlers in `sw-be-container/src/webserver/fields.rs` to validate the destination farm ownership (checking it belongs to `user_id = 1`) and update the field table.
- **Frontend**:
  - Implement `updateField(id: number | string, field: Partial<Field>)` in `FarmManagementService`. It will find the local RxDB document matching the server or local ID, retrieve the corresponding primary key, patch the document, and queue an outbox `PUT` action.
  - In `FieldsComponent`, add properties for editing state: `editingFieldId`, `editFieldName`, `editFieldArea`. Implement methods `startEdit`, `cancelEdit`, and `saveField` to update the fields inline.
  - In `FieldViewComponent`, add controls and modals to edit fields directly from the detail view.

## Verification Plan
- Unit tests for the backend PUT route.
- Unit tests for frontend service `updateField` and components `FieldsComponent` / `FieldViewComponent`.
