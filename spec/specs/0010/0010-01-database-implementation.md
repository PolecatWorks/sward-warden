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
   - **Multi-tenancy Enforced**: Implement a pseudo user ID (e.g., `user_id = 1`) to act as the authenticated user for all list/delete queries until full OAuth is implemented.
   - Handle database transaction failures gracefully by returning internal server error mapping via `MyError`.
5. **Testing Updates (`src/webserver/tests.rs`)**:
   - Tests will need to be refactored since the database is no longer a synchronous mock list.
   - Implement temporary mock handling or skip db-dependent unit tests depending on `sqlx` testing conventions for the module.
