# Technical Specification 0018-01: Multi-User Data Isolation and Admin Visibility

**State**: Complete

## Scope
This specification details the technical changes required to implement per-user database isolation on the frontend and admin role bypasses on the backend.

## Frontend Requirements

### 1. Dynamic RxDB Database Name
- **File**: `sw-fe-container/src/app/services/rxdb/rxdb.service.ts`
- **Changes**:
  - Inject `AuthService` (or read the localStorage `agent-user-id` key directly to prevent potential circular dependencies).
  - When initializing the database, construct the database name:
    - If a unique database name was injected (e.g. for testing via `RXDB_DB_NAME`), use it.
    - If a user is logged in (`userId` is present), use `swarddb_${userId}` as the database name.
    - Otherwise, default to `'swarddb'`.
  - This guarantees that when a user switches identity, a new IndexedDB database is opened, causing their local data and sync checkpoints to be completely isolated.

## Backend Requirements

### 1. Admin Role Determination
- **File**: `sw-be-container/src/webserver/auth.rs` or directly in handlers.
- **Changes**:
  - Implement a helper function `is_admin_user(pool: &PgPool, user_id: i64) -> Result<bool, sqlx::Error>`:
    - Query the `users` table: `SELECT role FROM users WHERE id = $1`.
    - Return true if the role is `'admin'`, false otherwise (or if the user doesn't exist).

### 2. Bypass Query Restrictions for Admin Role
- **Farms (`sw-be-container/src/webserver/farms.rs`)**:
  - `list_farms`: If user is admin, query all active farms: `SELECT ... FROM farms WHERE is_deleted = FALSE`.
  - `get_farm`: If user is admin, bypass owner check: `SELECT ... FROM farms WHERE id = $1 AND is_deleted = FALSE`.
  - `update_farm`: If user is admin, bypass owner check: `UPDATE farms SET ... WHERE id = $1 AND is_deleted = FALSE`.
  - `delete_farm`: If user is admin, bypass owner check: `UPDATE farms SET is_deleted = TRUE ... WHERE id = $1`.
- **Fields (`sw-be-container/src/webserver/fields.rs`)**:
  - `list_fields`: If user is admin, query all active fields: `SELECT ... FROM fields WHERE is_deleted = FALSE`.
  - `get_field`: If user is admin, bypass owner check.
  - `create_field`: If user is admin, bypass target farm ownership check (only verify that the target farm exists).
  - `update_field`: If user is admin, bypass farm ownership and destination farm ownership checks.
  - `delete_field`: If user is admin, bypass owner check.
- **Delta Sync (`sw-be-container/src/webserver/sync.rs`)**:
  - `delta_sync`: If user is admin, fetch all matching updated records from the database across all users.

---

## Verification Plan

### Automated Tests
- Run `make sw-fe-test` to ensure frontend builds and all unit tests pass.
- Run `make sw-be-test` to execute rust unit/integration tests.
- Run `make robot-test` to confirm end-to-end functionality.
