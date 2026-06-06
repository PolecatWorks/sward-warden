# Specification 0010-01: Database Implementation

## Goal
Implement a PostgreSQL connection pool using `sqlx`, migrate all CRUD operations off in-memory `RwLock<Vec<T>>` objects, and enforce multi-tenant database queries.

## State: Complete

## Technical Plan
1. **Schema Initialization**:
   - Add database schema initialization. Use `sqlx` migrations by creating a `migrations/` folder at the root of `sw-be-container`.
   - Migration 1: Create `users`, `farms`, `fields`, `events`, and `farm_records` tables with strict foreign key constraints.
2. **AppState Modification (`src/state.rs`)**:
   - Add `db_pool: sqlx::PgPool` to `AppState`.
   - Remove the old `Arc<RwLock<Vec<T>>>` fields and the associated fake data defaults.
   - Update `AppState::new()` to accept and construct the `PgPool`.
3. **Application Bootstrapping (`src/main.rs`)**:
   - Extract the `DATABASE_URL` from the config (e.g., `postgres://user:pass@localhost:5432/swarddb`).
   - Create the `PgPoolOptions` configuration and connect to the database.
   - Inject the `PgPool` into `AppState`.
   - Add a database reachability check into `src/startup_tools.rs` to ensure the application only starts when the DB is online.
4. **Endpoint Refactoring (`src/webserver/mod.rs`)**:
   - Replace vector `.read()` and `.write()` operations with `sqlx::query_as!` and `sqlx::query!` macros.
   - **Multi-tenancy Enforced**:
     - Extract the `user_id` dynamically from a secure authenticated context (e.g., validated JWT token). For local development, an `X-User-ID` header may be temporarily accepted.
     - **TODO**: Implement proper JWT payload parsing and authorization middleware in `src/webserver/auth.rs`. Remove reliance on `X-User-ID` for the production build.
     - Remove any hardcoded user IDs (e.g., `user_id = 1`).
     - Enforce tenant isolation on **read** operations: all list/select/delete queries must filter by `user_id` across all user data endpoints.
     - Enforce tenant isolation on **write** operations: all create (`INSERT`) and update (`UPDATE`) queries must verify parent ownership. For example, when inserting a `Field`, verify via database subquery or transaction that the associated `farm_id` belongs to the authenticated user. Direct cross-tenant writes must be prevented at the database query layer.
     - Admin users will continue to have access to all records via dedicated admin endpoints in `admin.rs`.
   - Handle database transaction failures gracefully by returning internal server error mapping via `AppError`.
5. **Testing Updates (`src/webserver/tests.rs`)**:
   - Tests will need to be refactored since the database is no longer a synchronous mock list.
   - Implement temporary mock handling or skip db-dependent unit tests depending on `sqlx` testing conventions for the module.
