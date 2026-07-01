# Spec 0001-08: Be Architecture Implementation

## 1. Description
This specification covers the implementation of the be architecture refactoring as defined in PRD 0001. It transitions `sw-be-container` from a simple MVP structure to a robust, production-ready foundation incorporating `figment` for configuration, `hams` for health checking, comprehensive error handling, and structured routing.

## 2. Acceptance Criteria
1. **Dependency Updates**: `Cargo.toml` is updated with all dependencies specified in PRD 0001 (e.g., `figment`, `hams`, `axum-prometheus`, `tokio-util`, etc.).
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
8. **Tests Pass**: The refactored be must compile successfully and all existing unit tests should be updated to pass.

## 3. Lifecycle, Startup and Shutdown Mechanics
1. **Synchronous Setup**:
   - The HaMS (Health and Monitoring Service) service initialization and startup must occur synchronously in `main()` *before* the Tokio async runtime is booted.
   - This ensures that if port binding or early configuration fails, the process terminates immediately without starting background threads.
2. **Unified Shutdown Handling**:
   - Register a shutdown callback hook with HaMS that is linked to a Tokio `CancellationToken`.
   - When HaMS receives a shutdown signal (e.g. SIGTERM/SIGINT), it must trigger `CancellationToken::cancel()` to gracefully stop the async web server and all background tasks.
3. **Non-Blocking Probes**:
   - All early/initial health probes must be registered with the monitoring engine during the synchronous setup phase so they are immediately active when the port opens, preventing probes from blocking Tokio thread execution pool start.
4. **Centralized Startup Error Handling**:
   - Wrap the startup phase with error catching logic. If startup fails, apply a configurable `fail_debug_delay` (retrieved from `AppConfig` under `WebServiceConfig.fail_debug_delay_seconds`) before exiting.
   - This delay keeps the container alive in a failed state for a short period to allow operators to retrieve Kubernetes logs (`kubectl logs`) before the Pod restarts.
5. **Graceful Cleanup**:
   - After the Tokio async runtime exits, `main()` must execute cleanup routines: explicitly deregister the service from Prometheus registry endpoints and stop the HaMS agent.

## 4. Implementation Steps
1. **Update Cargo.toml**: Add the dependencies defined in PRD 0001. Update the `[package]` edition if needed.
2. **Create config structure**: Create `src/config.rs` that loads from `config/default.yaml`, env vars `SP_BE__*`, etc. using `figment`.
3. **Setup state and errors**: Create `src/state.rs` for `AppState` and `src/error.rs` for `AppError`.
4. **Implement hams health monitoring**: Add `src/hams.rs` or configure it in `main.rs`/`tokio_tools.rs` to start health probe servers.
5. **Refactor web routes**: Move existing CRUD logic from `src/server.rs` into `src/webserver/mod.rs` and submodules (`users.rs`, `farms.rs`, etc.). Update signatures to accept `State<AppState>` and return `Result<impl IntoResponse, AppError>`.
6. **Integrate startup checks**: Create `src/startup_tools.rs` to run essential checks (e.g., DB reachability).
7. **Rewrite main.rs**: Connect all the pieces together (config load -> startup checks -> hams start -> tokio runtime/axum serve).

## 4. State
Complete
