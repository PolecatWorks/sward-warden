# Specification 0011-06: Self-Healing and Recovery Mechanisms

## Goal
Implement client-side self-healing and recovery mechanisms to prevent application freezes due to database initialization failures, IndexedDB corruption, or schema mismatches (e.g. when a new version of the UI is loaded with modified schemas).

## State: Open

## Technical Plan

### 1. Database Initialization Catch & Self-Heal
- **Error Interception**: Modify `RxdbService.createDatabase()` to wrap both `createRxDatabase` and `db.addCollections` inside a `try...catch` block.
- **Recovery via Database Wipe**:
  - If database creation or collection addition fails (e.g., due to schema mismatch or Dexie initialization errors), catch the exception.
  - Log the error to the console/logger service.
  - Invoke `removeRxDatabase(this.dbName, this.storage)` to destroy the existing local database structure and clear IndexedDB.
  - Attempt to initialize the database and add collections a second time.
- **Data Reconstruction (Full Sync)**:
  - When the database is wiped, the `metadata` collection (which holds the delta sync checkpoint) is deleted.
  - Upon successful reconstruction of the database on the second attempt, the client will naturally perform a full sync (checkpoint = epoch) during the next sync cycle, pulling down all fresh data from the server.

### 2. Graceful REST Fallback (Online-Only Mode)
- **Fallback Flag**: Define a public read-only property `fallbackToRest$: BehaviorSubject<boolean>` in `RxdbService`.
- **Second Attempt Failure**: If the second initialization attempt fails, catch the error, emit `true` to `fallbackToRest$`, and log a critical error.
- **REST Fallback Implementation**:
  - Implement a `RestDataService` that communicates directly with the backend APIs via `HttpClient`, bypassing RxDB.
  - Update `FarmManagementService` to check the status of `RxdbService.fallbackToRest$`. If fallback is active, route all data reads and writes through the direct REST calls instead of local RxDB collections.
- **UI Warning Banner**:
  - Display a top-level alert banner if `fallbackToRest$` is active.
  - The banner should inform the user: *"Offline support is temporarily unavailable due to a local storage error. Changes will not be saved offline."*

### 3. Outbox Failure Management
- **Stuck Outbox Handling**: Modify the Outbox table schema to allow `status: 'permanently_failed'`.
- **Retry Policy & Backoff**:
  - Track `retryCount` and `lastAttempt` timestamp in the outbox document.
  - Implement exponential backoff for retrying pending/failed outbox entries.
- **Permanent Failure Threshold**:
  - If a push sync request fails with an HTTP status `400 Bad Request` or `422 Unprocessable Entity` (indicating data validation errors that cannot be fixed by retrying), or if `retryCount` exceeds 5:
    - Mark the outbox entry as `permanently_failed` in the local DB.
    - Emit a notification to alert the user of the sync failure so they can review, edit, or discard the changes.

### 4. Periodic Consistency Checks
- **Startup Integrity Check**:
  - Once daily on startup (when online), compare a lightweight hash of local primary keys and timestamps with the server's records.
  - If a mismatch is detected, trigger a forced delta pull/clean to reconcile local state with the server.

## Acceptance Criteria
- When database initialization fails (e.g., due to simulated schema changes), the application automatically wipes the database and restarts it successfully.
- Following a database wipe, the application performs a full pull sync to rebuild the local store.
- If IndexedDB is blocked or disabled completely (causing repeated initialization failures), the app boots in "online-only" REST mode and displays a warning banner.
- A 400 Bad Request response for an outbox entry transitions it to `permanently_failed` without blocking other entries.
- All unit tests for the recovery and fallback paths pass.
