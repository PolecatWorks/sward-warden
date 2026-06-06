# 0003-06 Farm Editing Specification

**State**: Complete

## 1. Overview
This specification details the design and implementation for editing a farm's details (specifically its `name`, `location`, and `has_derogation` status) after it has been created.

## 2. Requirements

### 2.1. Backend API
- Implement a route: `GET /v0/farms/{id}` to fetch details for a single farm.
- Implement a route: `PUT /v0/farms/{id}` to update a farm's details.
- Access is restricted to farms belonging to the current user (hardcoded fallback `user_id = 1` matching other routes).
- The PUT route should update the farm's `name`, `location`, `has_derogation` status, and set `updated_at` to the current time, invalidate the cache, and return the updated farm model.

### 2.2. Frontend Service (`FarmManagementService`)
- Add method `updateFarm(id: number | string, farm: Partial<Farm>): Observable<Farm>`
- If offline/syncing is active (`fallbackToRest$` is false), the method will update the local RxDB database document, set `syncStatus` to `pending`, and queue a `PUT` outbox entry.
- If REST fallback is active, it will make a direct HTTP `PUT` request to `/v0/farms/{id}`.

### 2.3. Frontend UI Components
- Add component state for the edit farm modal (`showEditFarmModal`, `editingFarm`, `editFarmName`, `editFarmLocation`).
- Add an "Edit" button (pen icon) to each farm card next to the delete button.
- Clicking the "Edit" button opens the Edit Farm modal, prefilled with the farm's current name and location.
- Saving updates the farm via `FarmManagementService.updateFarm` and reloads the farms list.

## 3. Verification Plan
- Unit tests for the backend GET and PUT routes.
- Unit tests for frontend service `updateFarm` and UI component `FarmsComponent` edit modal flow.
- Integration tests in `test_be.robot` to verify GET and PUT endpoints for farms.
