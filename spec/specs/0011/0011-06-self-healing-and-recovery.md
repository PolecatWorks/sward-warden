# Specification 0011-06: Self-Healing and Recovery

## Goal
Implement an automatic self-healing mechanism that detects unrecoverable local database errors or irreconcilable sync states, automatically wipes the corrupted local RxDB database, and performs a full re-sync from the server to restore functionality without manual user intervention.

## State: Pending

## Technical Plan
1. **RxDB Database Removal in `RxdbService`**:
   - Implement a `removeDatabase()` method in the `RxdbService`.
   - This method should call RxDB's built-in `removeRxDatabase` function using the configured `dbName` and `storage` (e.g., Dexie).
   - Ensure any existing active database connections or subscriptions within the service are safely closed before attempting removal.
   - After removal, reset the internal state to allow `createDatabase()` to successfully re-initialize a fresh database instance on the next request.

2. **Error Detection in `SyncEngineService`**:
   - Wrap the main sync logic (both pull and push) in `try/catch` blocks designed to catch critical database or synchronization errors.
   - Define a set of error conditions that trigger the self-healing process. This might include:
     - RxDB internal schema mismatch errors.
     - Persistent 500-level errors from the server during sync that suggest corrupted local payloads.
     - Failure to initialize the RxDB database.
   - Implement a mechanism to avoid infinite wipe/re-sync loops (e.g., tracking wipe counts in `localStorage` or `sessionStorage` with a cooldown period).

3. **Self-Healing Execution Flow**:
   - When a critical error is detected:
     1. Stop any ongoing sync processes or timers.
     2. Call `rxdbService.removeDatabase()`.
     3. Clear the sync checkpoint stored in the `metadata` collection (since the database wipe also clears the checkpoint).
     4. Notify the user via the `LoggerService` or a UI toast that a database recovery is in progress.
     5. Re-initialize the RxDB database by accessing `rxdbService.db$`.
     6. Trigger a full pull sync (without a `since` parameter) to download the entire state from the server.
     7. Restart normal background sync operations.

4. **Testing**:
   - Unit tests for `removeDatabase()` in `RxdbService` to ensure it correctly calls `removeRxDatabase` and allows subsequent re-initialization.
   - Integration tests simulating a corrupted database state to verify the `SyncEngineService` correctly catches the error, triggers the wipe, and initiates a full sync.
   - Tests ensuring the loop-prevention mechanism works correctly.

## Acceptance Criteria
- The `RxdbService` exposes a method to completely remove and reset the local database.
- The `SyncEngineService` detects critical database errors during operation.
- Upon detecting a critical error, the application automatically wipes the local database, re-initializes it, and performs a full synchronization from the server.
- The application recovers from simulated database corruption without requiring a page reload or manual cache clearing.
- The user is notified when a recovery process occurs.
- Re-sync loop prevention mechanisms are in place.
- All associated tests pass.
