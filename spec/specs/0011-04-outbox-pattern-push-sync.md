# Specification 0011-04: Outbox Pattern and Push Sync

## Goal
Implement the outbox pattern so that user write operations are queued locally and pushed to the backend when connectivity is available. This ensures offline writes never fail from the user's perspective.

## State: Open

## Technical Plan
1. **Outbox Collection in RxDB**:
   - Define an `outbox` collection in the RxDB database (created in spec 0011-01).
   - Schema fields: `id` (string, primary), `actionType` (`POST` | `PUT` | `DELETE`), `entityType` (e.g., `farms`, `fields`), `payload` (JSON object), `timestamp` (ISO 8601 string), `status` (`pending` | `failed`), `retryCount` (number).
2. **Write Interception**:
   - Refactor the data services (from spec 0011-01) so that every local write (create, update, delete) also inserts a corresponding record into the outbox collection.
   - The local RxDB record is updated immediately (optimistic UI); the outbox entry tracks the intent to push to the server.
3. **Sync Engine Service (`SyncEngineService`)**:
   - Create `src/app/services/sync-engine.service.ts` responsible for processing the outbox queue.
   - On detecting connectivity (subscribing to `NetworkService.isOnline$` from spec 0011-02), the engine iterates through `pending` outbox entries in timestamp order and executes the corresponding HTTP requests against the backend API.
   - On success: remove the outbox entry and update the local record's `syncStatus` to `synced`.
   - On failure: increment `retryCount`, set status to `failed` if retries exceed a configurable threshold (default: 3). Leave the local record's `syncStatus` as `pending` or set to `failed`.
   - Drive `SyncStateService` (from spec 0011-02) transitions: set `syncing` when processing begins, `synced` when the queue is empty.
4. **Background Sync Integration**:
   - Register an Angular Service Worker and configure the Web Background Sync API so that outbox processing is triggered even when the user has closed the app tab.
   - Fallback: if Background Sync is unsupported, rely on the `online` event to trigger sync.
5. **Testing**:
   - Unit tests verifying outbox entries are created on local writes.
   - Unit tests for `SyncEngineService` verifying queue processing order, success path (entry removal), and failure path (retry/threshold).
   - Unit tests verifying `SyncStateService` transitions are driven correctly by the engine.

## Acceptance Criteria
- Every local create/update/delete produces an outbox entry.
- When online, pending outbox entries are sent to the backend in chronological order.
- Successful pushes remove the outbox entry and mark the local record as `synced`.
- Failed pushes are retried up to the configured threshold.
- Sync state UI reflects `syncing` and `synced` states accurately.
- All unit tests pass.
