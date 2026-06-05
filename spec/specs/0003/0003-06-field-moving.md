# 0003-07 Field Moving Specification

**State**: Open

## Scope
This specification covers the implementation details of moving (migrating) a field to a different farm, as part of Field Management in PRD 0003.

## Features
- **Backend API Endpoints**:
  - `PUT /v0/fields/{id}`: Update a field's properties, allowing its `farm_id` to be modified (effectively moving the field to a different farm), as well as name, area, and land use.
- **Frontend local-first support**:
  - Extend `FarmManagementService` to support updating fields locally in RxDB and queuing a sync outbox entry.
- **Field Editing UI**:
  - Introduce an "Edit Field" button and dialog in the Field Details view, allowing users to rename fields, adjust their area, change land use, and select a different destination farm from their portfolio.

## Technical Details
- **Backend**:
  - Register the route `PUT /v0/fields/{id}` on `app_router` in `sw-be-container/src/webserver/mod.rs`.
  - Add query handlers in `sw-be-container/src/webserver/fields.rs` to validate the destination farm ownership (checking it belongs to `user_id = 1`) and update the field table.
- **Frontend**:
  - Implement `updateField(id: number, updates: Partial<Field>)` in `FarmManagementService`. It will find the local RxDB document matching the server or local ID, retrieve the corresponding primary key, patch the document, and queue an outbox `PUT` action.
  - In `FieldViewComponent`, load all farms via `getFarms()`.
  - In `FieldViewComponent`, add an edit modal/dialog triggered by an "Edit Field" button. Submitting the form calls `updateField` on `FarmManagementService`.
  - When a field's farm is updated successfully, redirect or update the routing so that the back-button continues to work correctly with the new `farm_id`.
