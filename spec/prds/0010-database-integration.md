# PRD 0010: Database Integration and Multi-Tenancy

## Objective
Migrate the `sp-be-container` backend away from the legacy MVP in-memory `RwLock<Vec<T>>` data structures to a real, persistent database implementation using PostgreSQL. This will ensure production readiness, enforce multi-tenancy, and enable persistent storage.

## Requirements
1. **Connection Pooling**: Utilize `sqlx` to establish a robust, asynchronous PostgreSQL connection pool (`PgPool`) initialized on application startup.
2. **State Migration**: Update the `AppState` in `src/state.rs` to hold the `sqlx::PgPool` instead of the legacy in-memory collections (`users`, `farms`, `fields`, `events`, `farm_records`).
3. **Multi-Tenancy**: The application must enforce strict multi-tenancy. Every request that interacts with user-specific data (e.g., `farms`, `fields`) must filter the query based on the authenticated user's ID to prevent cross-account data leakage. Note: Since Authentication is not fully wired yet, we will initially simulate a mocked user session for queries, but the database queries MUST strictly enforce `user_id = $1` filters.
4. **Endpoint Refactoring**: Refactor all CRUD routes in `src/webserver/mod.rs` to execute standard SQL queries.
5. **Schema Setup**: Prepare SQL initialization scripts or `sqlx` migrations to define the database schema (Tables: `users`, `farms`, `fields`, `events`, `farm_records`), respecting the multi-tenant foreign keys (e.g., `user_id` on `farms`).
6. **Startup Checks**: The backend must refuse to start and crash early if the PostgreSQL database is unreachable, utilizing the `hams` and `startup_tools.rs` logic.

## Acceptance Criteria
- `AppState` strictly uses `sqlx::PgPool` for all data handling.
- All CRUD handlers correctly write to and read from the PostgreSQL database using asynchronous SQL queries.
- SQL queries inherently enforce multi-tenancy via foreign key relations.
- `cargo test` executes successfully, ideally with mocked databases or ignored DB integration tests for standard unit checks.
- Application compiles successfully.
