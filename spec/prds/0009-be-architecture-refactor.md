# PRD 0009: Be Architecture Refactor

## 1. Overview
The current be implementation in `sw-be-container` is a simple proof-of-concept utilizing in-memory state (`Arc<RwLock<Vec<T>>>`), basic error handling, and primitive configuration management. This document specifies a comprehensive refactoring of the be to adopt enterprise-grade Rust patterns based on an established reference architecture.

## 2. Objectives
- Improve application reliability, scalability, and maintainability.
- Standardize configuration loading using layered configurations.
- Implement robust health checking, startup dependency verification, and graceful shutdown.
- Standardize error handling and HTTP responses.
- Decouple the web server routing into a structured, modular design.

## 3. Core Refactoring Areas

### 3.1. Configuration Management (Figment)
- Replace the current `config` crate implementation with `figment` and `serde`.
- Configuration should support merging from:
  1. Default YAML configuration (`config/default.yaml`).
  2. Environment-specific YAML configuration (`config/$RUN_MODE.yaml`).
  3. Secrets file (`config/secrets.yaml`).
  4. Environment variables prefixed with `SP_BE__`.
- Configuration should be strictly typed (e.g., `AppConfig` containing sub-configurations like `WebServiceConfig`, `RuntimeConfig`, `DatabaseConfig`, `HamsConfig`).
- The application should *fail fast* if required configurations are missing or malformed.
- **No Defaults in Loaded Configuration**: Avoid defining default fallbacks for configuration fields (e.g., using `#[serde(default)]` or custom default deserialization functions). All configuration properties must be explicitly provided in configuration sources (such as YAML files, Helm values, Garden manifests, or environment variables) so that assumptions are not hidden and the explicit state of the application is clearly visible.


### 3.2. Application State (`AppState`)
- Introduce a centralized strongly-typed `AppState` struct replacing the existing `Arc<RwLock>` defaults.
- The `AppState` must be initialized during application startup and injected into Axum handlers via `axum::extract::State`.
- It should hold:
  - Application configuration.
  - Telemetry and Metrics Registry (`axum_prometheus`).
  - Connection pools for PostgreSQL (e.g., `sqlx::PgPool`), replacing the in-memory vectors.

### 3.3. Robust Startup & Dependency Checks
- Implement a startup verification phase (`startup_tools.rs` pattern).
- Before binding the HTTP listener, the application must perform asynchronous checks with retries to ensure critical dependencies (like PostgreSQL connectivity) are reachable.
- If checks fail beyond configured thresholds, the application should exit gracefully.

### 3.4. Health Probes and Telemetry (`hams` & `axum_prometheus`)
- Integrate the `hams` crate for lifecycle management.
- Serve health endpoints on a dedicated port (e.g., 8079) separate from the main API (port 8080).
- Expose `/hams/alive`, `/hams/ready`, `/hams/startup`, and `/hams/shutdown`.
- Integrate `axum_prometheus` middleware into the main application router to automatically expose HTTP request metrics.

### 3.5. Concurrency and Tokio Runtime
- Introduce explicit Tokio runtime configuration using a `ThreadRuntime` configuration struct (allowing control over thread count, stack size, and naming).
- Utilize `tokio_util::sync::CancellationToken` to handle graceful shutdown signals effectively, propagating cancellation across internal async tasks.

### 3.6. Unified Error Handling
- Create an `AppError` enum (similar to the reference `MyError`) that consolidates all potential errors (e.g., Database errors, I/O errors, Configuration errors, Not Found).
- Implement `axum::response::IntoResponse` for `AppError` to ensure consistent JSON error responses across all API endpoints.

### 3.7. Routing Organization
- Refactor `server.rs` into a module-based structure (e.g., `src/webserver/mod.rs` with separate files/modules for `users`, `farms`, `fields`, `events`, and `records`).
- Remove monolithic implementations and focus on distinct, focused handlers.
- Each handler should rely strictly on `AppState` and proper `AppError` return types.

### 3.8. HaMS Lifecycle and Service Initialization
- **Synchronous Setup**: `HaMS` service initialization and starting must occur synchronously within `main()` before the `tokio` async runtime is initialized. This ensures the monitoring system is active during the entire application lifecycle.
- **Unified Shutdown Handling**: The application must link the `HaMS` shutdown signal (triggered by SIGTERM/SIGINT) to the internal `CancellationToken`. This is achieved by registering a shutdown callback with `HaMS` that calls `ct.cancel()`.
- **Non-Blocking Probes**: Initial health probes (e.g., database connectivity status) must be registered during the synchronous setup phase to avoid the risk of blocking `tokio` runtime threads during registration.
- **Initialization Error Handling**: The entire service startup flow, including configuration loading and `HaMS` setup, should be wrapped in a centralized error handler. This handler must apply a configurable `fail_debug_delay` (if provided in the configuration) before the process exits, allowing for container inspection and log retrieval in Kubernetes environments.
- **Graceful Cleanup**: Upon application shutdown (after the async runtime exits), `HaMS` should be explicitly deregistered from Prometheus and stopped to ensure a clean release of system resources.

## 4. Dependencies to Add/Update
The `sw-be-container/Cargo.toml` should be updated to align with the reference project's dependencies:

```toml
[dependencies]
axum = { version ="^0.8", features = ["macros"] }
url = { version = "^2.5", features = ["serde"] }
log = "^0.4"
clap = { version = "^4.6", features = ["derive", "string", "env"] }
dotenv = "^0.15"
env_logger = "^0.11"
figment = { version = "^0.10", features = ["yaml", "env"] }
figment_file_provider_adapter = "~0.1"
serde = { version = "^1.0.228", features = ["derive"] }
serde_json = "^1.0"
serde_yaml = "0.9"
tokio = { version = "^1.52", features = ["full"] }

# Telemetry
opentelemetry = "^0.31"
opentelemetry_sdk = { version = "^0.31", features = ["rt-tokio", "metrics"] }
opentelemetry-prometheus-text-exporter = "^0.2"
prometheus = "^0.14"
tracing = "^0.1"
tracing-opentelemetry = "^0.32"
tracing-subscriber = { version = "^0.3", features = ["env-filter"] }
axum-prometheus = "^0.10"

# Utils & Middleware
thiserror = "^2.0"
reqwest = { version = "^0.13", default-features = false, features = ["json"] }
tower-http = { version = "^0.6", features = ["trace", "cors"] }
tokio-util = "^0.7"
serde_with = "^3.16"
humantime-serde = "^1.1"
chrono = { version = "^0.4", features = ["serde"] }
futures = "~0.3"

dashmap = "^6.0"
hams = { git = "https://github.com/PolecatWorks/hams.git" }
ffi-log2 = { git = "https://github.com/PolecatWorks/hams.git" }
sqlx = { version = "0.8", features = ["postgres", "runtime-tokio-rustls", "chrono"] }
```
