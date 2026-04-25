# Specification 0011-01: RxDB Local Database Setup

## Goal
Integrate RxDB into the Angular frontend as the local-first data layer. Define local schemas mirroring the backend PostgreSQL models and rewire Angular services to read/write from RxDB instead of making direct HTTP calls.

## State: Open

## Technical Plan
1. **Dependency Installation**:
   - Install `rxdb` and required plugins (e.g., `rxdb/plugins/storage-dexie` for IndexedDB-backed storage) into `sw-fe-container`.
   - Install `rxdb/plugins/dev-mode` for development-time validation and schema checks.
2. **Database Initialisation Service (`RxdbService`)**:
   - Create an Angular service (`src/app/services/rxdb.service.ts`) responsible for creating and exposing the RxDB database instance.
   - The database should be initialised lazily on first access and shared as a singleton across the application.
   - Expose typed collection accessors (e.g., `farms$`, `fields$`, `events$`).
3. **Schema Definitions**:
   - Define RxDB JSON schemas for each collection: `farms`, `fields`, `events`, `farm_records`.
   - Schemas must include a `syncStatus` field (`synced` | `pending` | `failed`) and an `updatedAt` timestamp to support future sync operations.
   - Schema versions should start at `0` with migration strategies defined for future version bumps.
4. **Service Layer Refactoring**:
   - Refactor existing Angular data services (e.g., `FarmService`) to write to and read from RxDB collections.
   - All UI reads should subscribe to RxDB reactive queries (observables) so the UI updates immediately on local writes.
   - HTTP calls to the backend API should be removed from the direct read/write path; they will be reintroduced in specs 0011-03 and 0011-04 as part of the sync layer.
5. **Testing**:
   - Unit tests for `RxdbService` verifying database creation and collection availability.
   - Unit tests for refactored services confirming local CRUD operations against RxDB (using an in-memory storage adapter for tests).

## Acceptance Criteria
- RxDB database is initialised on application startup with all required collections.
- Angular data services perform CRUD against local RxDB collections.
- UI components continue to function identically (no regressions) using local data.
- All new and existing unit tests pass.
