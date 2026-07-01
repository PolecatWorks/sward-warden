# 0003-07 Farm and Field Management Updates Specification

**State**: Complete

## Scope
This specification covers the implementation details for several enhancements to Farm and Field Management under PRD 0003:
1. Dynamic backend user ownership verification using the `X-User-ID` header.
2. Safe farm deletion (preventing deletion of farms with active fields).
3. Risks protection for farm deletion (removing delete from list view, adding dedicated Farm Details page with inline confirmation).
4. Splitting Farms and Fields into two separate top-level navigation items.
5. Enabling field migration/moving to a different farm.

## Features

### 1. Security & Ownership Enforcement
- **Backend**:
  - Implement a custom Axum request extractor `UserId` that parses the `X-User-ID` header (defaulting to `1` if missing).
  - Update all handlers for farms, fields, events, farm records, soil analyses, plans, applications, compliance breaches, and sward movements to filter database queries by the dynamically extracted `user_id`.
  - Validate that users can only fetch, delete, or update entities belonging to them.

### 2. Safe Farm Deletion
- **Backend**:
  - In `delete_farm`, query the `fields` table to check if there are any active (non-deleted) fields belonging to the farm.
  - If active fields exist, return an HTTP 400 Bad Request error.
- **Frontend**:
  - If a farm has fields (count > 0), disable the delete farm button and display a warning message advising the user to migrate or delete the fields first.

### 3. Dedicated Farm Details View & Risky Delete Protection
- **Frontend**:
  - Create a new component `FarmDetailComponent` mapped to `/farms/:farmId`.
  - Remove the delete button from the farms list view in `FarmsComponent`.
  - In `FarmDetailComponent`, display farm name, location, and derogation details.
  - Include a "Delete Farm" button. Clicking it displays an inline confirmation message ("Are you sure you want to delete this farm? This action cannot be undone.") and "Confirm" / "Cancel" buttons.
  - Clicking "Confirm" calls `deleteFarm` on `FarmManagementService` and redirects to `/farms`.

### 4. Separate Farms & Fields Views
- **Frontend**:
  - Update `MainLayoutComponent` desktop sidebar and mobile navigation to list two separate menu items: "Farms" (`/farms`) and "Fields" (`/fields`).
  - Update `FarmsComponent` to only list farms (remove fields tab/toggle and fields list).
  - Update `FieldsComponent` to handle two routing scenarios:
    - Top-level `/fields`: display all fields in the portfolio. Show the farm name on each card. In the "Add Field" form, display a dropdown to select which farm the field belongs to.
    - Farm-specific `/farms/:farmId/fields`: display fields for the specified farm, show the "Back to Farms" link, and pre-select the farm in the "Add Field" form.

### 5. Field Migration
- **Frontend**:
  - Implement `updateField(id: number, updates: Partial<Field>)` in `FarmManagementService` to update fields locally in RxDB and queue a sync outbox `PUT` action.
  - In `FieldViewComponent` (field details page), add an "Edit Field" button and modal dialog.
  - The dialog allows modifying field name, area, land use, and selecting a destination farm from a dropdown of all user farms.
  - Upon successful migration to a different farm, update router links and the back button to point to the new farm's fields.

## Technical Details

### Backend Routes & Handlers
- Update signatures in `farms.rs`, `fields.rs`, `events.rs`, `applications.rs`, `compliance.rs`, `movements.rs`, and `sync.rs` to accept `UserId`.
- Implement `PUT /v0/fields/{id}` in `fields.rs`.

### Frontend Routes
- Add `/fields` mapping to `FieldsComponent` in `app.routes.ts`.
- Add `/farms/:farmId` mapping to `FarmDetailComponent` in `app.routes.ts`.
