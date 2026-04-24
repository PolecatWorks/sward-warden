# Spec 0009-01: Backend Architecture Implementation

## 1. Description
This specification covers the implementation of the backend architecture refactoring as defined in PRD 0009. It transitions `sp-be-container` from a simple MVP structure to a robust, production-ready foundation incorporating `figment` for configuration, `hams` for health checking, comprehensive error handling, and structured routing.

## 2. Acceptance Criteria
1. **Dependency Updates**: `Cargo.toml` is updated with all dependencies specified in PRD 0009 (e.g., `figment`, `hams`, `axum-prometheus`, `tokio-util`, etc.).
2. **Configuration (`config.rs`)**: Replaced existing configuration parser with `figment`. Added definitions for `AppConfig`, `WebServiceConfig`, `RuntimeConfig`, `DatabaseConfig`, and `HamsConfig`.
3. **State Management (`state.rs`)**: Introduced a strongly-typed `AppState` containing the loaded `AppConfig`, metrics registries, and standard utility locks/dashmaps (or database connection pool).
4. **Error Handling (`error.rs`)**: Introduced an `AppError` enum implementing `axum::response::IntoResponse`. Existing `unwrap()` calls replaced with `?` propagating `AppError`.
5. **Startup Tools (`startup_tools.rs`)**: Created retry-enabled functions to verify connectivity (e.g., to PostgreSQL) prior to server start.
6. **Web Server Modularization (`webserver/mod.rs`)**:
   - Moved Axum router definition into `webserver/mod.rs`.
   - Setup `axum-prometheus` and telemetry tracking layers.
7. **Main & Tokio Tools (`main.rs`, `tokio_tools.rs`)**:
   - Configured custom Tokio runtime.
   - Initialized `hams` background health check tasks on port 8079.
   - Bound main Axum application on configured port (e.g., 8080).
8. **Tests Pass**: The refactored backend must compile successfully and all existing unit tests should be updated to pass.

## 3. Implementation Steps
1. **Update Cargo.toml**: Add the dependencies defined in PRD 0009. Update the `[package]` edition if needed.
2. **Create config structure**: Create `src/config.rs` that loads from `config/default.yaml`, env vars `SP_BE__*`, etc. using `figment`.
3. **Setup state and errors**: Create `src/state.rs` for `AppState` and `src/error.rs` for `AppError`.
4. **Implement hams health monitoring**: Add `src/hams.rs` or configure it in `main.rs`/`tokio_tools.rs` to start health probe servers.
5. **Refactor web routes**: Move existing CRUD logic from `src/server.rs` into `src/webserver/mod.rs` and submodules (`users.rs`, `farms.rs`, etc.). Update signatures to accept `State<AppState>` and return `Result<impl IntoResponse, AppError>`.
6. **Integrate startup checks**: Create `src/startup_tools.rs` to run essential checks (e.g., DB reachability).
7. **Rewrite main.rs**: Connect all the pieces together (config load -> startup checks -> hams start -> tokio runtime/axum serve).

## 4. State
Open
