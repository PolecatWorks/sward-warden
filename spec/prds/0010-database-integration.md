# PRD 0010: Database Integration and Multi-Tenancy

## Objective
Migrate the `sw-be-container` be away from the legacy MVP in-memory `RwLock<Vec<T>>` data structures to a real, persistent database implementation using PostgreSQL. This will ensure production readiness, enforce multi-tenancy, and enable persistent storage.

## Requirements
1. **Connection Pooling**: Utilize `sqlx` to establish a robust, asynchronous PostgreSQL connection pool (`PgPool`) initialized on application startup.
2. **State Migration**: Update the `AppState` in `src/state.rs` to hold the `sqlx::PgPool` instead of the legacy in-memory collections (`users`, `farms`, `fields`, `events`, `farm_records`).
3. **Multi-Tenancy**: The application must enforce strict multi-tenancy. Every request that interacts with user-specific data (e.g., `farms`, `fields`, `events`, `applications`, `movements`, `soil_analyses`, `fertilisation_plans`, `farm_records`, `compliance_breaches`) must filter the query based on the authenticated user's ID to prevent cross-account data leakage.
   - The backend MUST extract the `user_id` dynamically from a secure authenticated context (e.g., validated JWT token payload).
   - **Note on `X-User-ID` Header:** While `X-User-ID` may be used as a temporary development mechanism (as per PRD 0017) or injected by a trusted internal API gateway, production environments must never blindly trust a raw `X-User-ID` header originating from the client, as this introduces IDOR vulnerabilities.
   - **TODO:** Fully implement secure JWT validation in the backend and ensure the frontend passes standard `Authorization: Bearer <token>` headers instead of relying on `X-User-ID` before the application moves to production.
   - Hardcoded user IDs (such as `user_id = 1`) are prohibited.
   - Admin users do not have explicit APIs. They have elevated privileges that they act upon the full list of items in the data via standard endpoints and are not filtered by ownership of fields or farms. Normal users MUST ONLY see data linked to their own `user_id`.
   - All assets and tables in the system that relate to a user's data must enforce this.
4. **Endpoint Refactoring**: Refactor all CRUD routes in `src/webserver/mod.rs` to execute standard SQL queries and use the dynamically extracted user ID.
5. **Schema Setup**: Prepare SQL initialization scripts or `sqlx` migrations to define the database schema (Tables: `users`, `farms`, `fields`, `events`, `farm_records`), respecting the multi-tenant foreign keys (e.g., `user_id` on `farms`).
6. **Startup Checks**: The be must refuse to start and crash early if the PostgreSQL database is unreachable, utilizing the `hams` and `startup_tools.rs` logic.

## Acceptance Criteria
- `AppState` strictly uses `sqlx::PgPool` for all data handling.
- All CRUD handlers correctly write to and read from the PostgreSQL database using asynchronous SQL queries.
- SQL queries inherently enforce multi-tenancy via foreign key relations and dynamically injected user IDs.
- Hardcoded user IDs (like `user_id = 1`) are removed from all standard endpoints.
- `cargo test` executes successfully, ideally with mocked databases or ignored DB integration tests for standard unit checks.
- Application compiles successfully.

## Test Patterns
To confirm multi-tenancy is working correctly, the following test patterns must be implemented:
- **Data Isolation Test**: Create User A and User B. Create a farm for User A. Log in as User B and verify the farm list is empty. Log in as User A and verify the farm is visible.
- **Cross-Tenant Access Denial**: Attempt to access, update, or delete User A's farm or field directly by ID using User B's authentication token/header. The system must return a 403 Forbidden or 404 Not Found.
- **Admin Visibility Test**: Log in as an Admin user and verify that farms and fields for both User A and User B are visible via standard endpoints.
- **Asset Cascading Validation**: Verify that filtering by `user_id` on the `farms` table correctly cascades to all child entities (e.g., fields, events, farm_records, soil analyses) so User A cannot see User B's data across all tables.
