# 0003-05 Farm Editing Specification

**State**: Open

## Scope
This specification covers the implementation details of editing a farm after it has been created, as part of Farm Management in PRD 0003.

## Features
- **Backend API Endpoints**:
  - `GET /v0/farms/{id}`: Fetch details for a specific farm.
  - `PUT /v0/farms/{id}`: Update farm name, location, and derogation status.
- **Frontend local-first support**:
  - Extend `FarmManagementService` to support updating farms locally in RxDB and queuing a sync outbox entry.
- **Farm Editing UI**:
  - Introduce an edit modal or edit view on the Farms page to allow editing existing farms.

## Technical Details
- **Backend**:
  - Register new routes on `app_router` in `sw-be-container/src/webserver/mod.rs`.
  - Add query handlers in `sw-be-container/src/webserver/farms.rs`.
  - Invalidate the farms read cache upon a successful update.
- **Frontend**:
  - Implement `updateFarm` in `FarmManagementService` to support local-first updating and queuing outbox `PUT` action.
  - Add an edit button on each farm card in `FarmsComponent` which opens an edit dialog pre-filled with the farm details.
