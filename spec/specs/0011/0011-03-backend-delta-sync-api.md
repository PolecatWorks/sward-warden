# Specification 0011-03: Backend Delta Sync API

## Goal
Extend the backend PostgreSQL schema and Axum API to support delta synchronisation. This enables the frontend to pull only records modified since a given checkpoint, rather than downloading the full dataset.

## State: Complete

## Technical Plan
1. **Schema Migration**:
   - Add an `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` column to all data tables (`farms`, `fields`, `events`, `farm_records`).
   - Add an `is_deleted BOOLEAN NOT NULL DEFAULT FALSE` column to all data tables to support soft deletes.
   - Create a new `sqlx` migration in `sw-be-container/migrations/` for these schema changes.
   - Add a database trigger or application-level logic to automatically update `updated_at` on every row modification.
2. **Soft Delete Refactoring**:
   - Refactor existing `DELETE` handlers to perform soft deletes (`UPDATE ... SET is_deleted = TRUE, updated_at = NOW()`) instead of hard deletes.
   - Refactor existing `SELECT`/list handlers to filter out soft-deleted records (`WHERE is_deleted = FALSE`) for standard API usage.
3. **Delta Sync Endpoint**:
   - Implement `GET /api/sync` accepting a `since` query parameter (ISO 8601 timestamp).
   - The endpoint returns all records across all entity types where `updated_at > $since`, including soft-deleted records (so the client can remove them locally).
   - Response format:
     ```json
     {
       "checkpoint": "2026-04-25T10:00:00Z",
       "farms": [...],
       "fields": [...],
       "events": [...],
       "farm_records": [...]
     }
     ```
   - The `checkpoint` value is the server's current timestamp at the time of the query, to be used by the client as the `since` value for the next sync request.
   - Multi-tenancy enforced: all queries filter by the authenticated user's ID.
4. **Testing**:
   - Unit tests for the soft-delete behaviour (record not returned in standard list, but returned in sync response).
   - Unit tests for the `/api/sync` endpoint verifying correct delta filtering by `since` parameter.
   - Unit tests verifying `updated_at` is set on create and updated on modify.

## Acceptance Criteria
- All data tables have `updated_at` and `is_deleted` columns.
- Standard CRUD endpoints exclude soft-deleted records.
- `GET /api/sync?since=<timestamp>` returns only records modified after the given timestamp, including soft-deleted records.
- Multi-tenancy is enforced on the sync endpoint.
- All unit tests pass; `cargo test` succeeds.
