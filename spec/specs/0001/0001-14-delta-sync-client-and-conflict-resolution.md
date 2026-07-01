# Specification 0001-14: Delta Sync Client and Conflict Resolution

## Goal
Implement the client-side pull-sync mechanism that fetches only changed records from the be using the delta sync API (spec 0011-03), and define the conflict resolution strategy for records modified both locally and on the server.

## State: Complete

## Technical Plan
1. **Checkpoint Storage**:
   - Store the last successful sync checkpoint (ISO 8601 timestamp) in an RxDB `metadata` collection (key-value store).
   - On first sync (no checkpoint exists), perform a full pull by omitting the `since` parameter or using epoch.
2. **Pull Sync in `SyncEngineService`**:
   - Extend the `SyncEngineService` (from spec 0011-04) to perform a pull after the outbox queue has been flushed.
   - Call `GET /api/sync?since=<lastCheckpoint>` using the stored checkpoint.
   - Upsert returned records into the corresponding RxDB collections.
   - For records where `is_deleted` is `true`, remove them from the local RxDB collection.
   - On successful pull, update the stored checkpoint to the `checkpoint` value from the server response.
3. **Conflict Resolution Strategy**:
   - **Decision**: Adopt **Last Write Wins (LWW)** based on the `updatedAt` timestamp as the initial strategy. This is the simplest approach and acceptable for the current single-user-per-farm model.
   - When upserting a pulled record, compare the server's `updatedAt` with the local record's `updatedAt`:
     - If the server record is newer → overwrite the local record.
     - If the local record is newer and has a `pending` outbox entry → keep the local record (it will be pushed on the next sync cycle).
     - If the local record is newer and has no pending outbox entry → overwrite with the server record (local changes were already pushed).
   - **Future Enhancement Note**: PRD 0001 lists Semantic Merging and Version Headers as alternative strategies. These can be introduced in a future spec if LWW proves insufficient (e.g., multi-user concurrent editing scenarios).
4. **Sync Scheduling**:
   - Trigger a pull sync on the following events:
     - Application startup (if online).
     - Network state transitions from offline → online.
     - Periodically (configurable interval, default: 5 minutes) while online.
   - Use RxJS `timer` and `switchMap` to avoid overlapping sync operations.
5. **Testing**:
   - Unit tests for checkpoint storage and retrieval.
   - Unit tests for pull sync: verifying upserts, soft-delete removals, and checkpoint updates.
   - Unit tests for LWW conflict resolution: server-newer, local-newer-with-pending, local-newer-without-pending scenarios.
   - Unit tests for sync scheduling (startup, reconnection, periodic triggers).

## Acceptance Criteria
- The client pulls only records changed since the last checkpoint.
- Soft-deleted records are removed from local storage on pull.
- LWW conflict resolution correctly resolves server vs. local record conflicts.
- The sync checkpoint is updated after each successful pull.
- Sync triggers on startup, reconnection, and at configurable intervals.
- All unit tests pass.
