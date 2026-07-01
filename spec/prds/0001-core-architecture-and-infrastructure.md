# PRD 0001: Core Architecture & Infrastructure

## Overview
This document defines the overarching application architecture for the sward management application, covering frontend (FE), backend (BE), deployment strategies, database integration, security, and offline capabilities. It consolidates requirements previously spread across multiple architecture-focused PRDs (0001, 0009, 0010, 0011, 0015).

## 1. Frontend (FE) Requirements
- **Framework:** Angular
- **Layout Pattern:** Persistent shell layout using a `MainLayoutComponent` with nested `<router-outlet>` to ensure stable navigation (Header/BottomNav) across view transitions.
- **Design System:** Custom premium aesthetic using Tailwind CSS, Google Fonts (Work Sans), and curated HSL color palettes. Angular Material remains supported for low-level primitive components.
- **Location:** Code resides in `sw-fe-container` directory.
- **Runtime Configuration:** The FE must support dynamic configuration loading at startup. It fetches a configuration JSON from the `assets` directory (e.g., `/assets/contents/app-config.json`) before bootstrapping, allowing configuration at deployment time without rebuilding the Docker image.

## 2. Backend (BE) Requirements
- **Language/Framework:** Rust using the Axum web framework.
- **Location:** Code resides in `sw-be-container` directory.
- **Application State (`AppState`):** Centralized strongly-typed state, injected into Axum handlers. Holds application configuration, Telemetry, and connection pools for PostgreSQL.
- **App Framework & CLI:**
  - Application configuration is via YAML files, with secret files and environment variable overrides using `figment`.
  - Application must fail fast if required configurations are missing or malformed (no default fallbacks, such as using `#[serde(default)]` or custom default deserializers; all configuration properties must be explicitly provided in configuration sources).
  - Application binary must feature CLI parsing: `serve`, `version`, `migrate`.
- **Concurrency & Web Server:**
  - Explicit Tokio runtime configuration via a `ThreadRuntime` struct (controlling thread count, stack size, and naming).
  - Propagate shutdown signals across internal async tasks via a `tokio_util::sync::CancellationToken`.
  - Modular routing organization (e.g., separate files for `users`, `farms`, `fields`, etc.).
  - Unified error handling (`AppError` enum implementing `axum::response::IntoResponse`).
- **Networking:**
  - Main HTTP traffic served on port 8080.
  - Lifecycle and health events served via HTTP on port 8079.

## 3. Database Integration & Multi-Tenancy
- **Database:** PostgreSQL for relational data storage.
- **Connection Pooling:** `sqlx::PgPool` initialized on startup.
- **Multi-Tenancy Enforcement:**
  - Strict multi-tenancy: every request interacting with user-specific data must filter by the authenticated user's ID.
  - Hardcoded user IDs are prohibited.
  - Assets and tables must enforce isolation via foreign key relations cascading from the `user_id`.
  - Admin users bypass `user_id` filtering but act securely on the data.

## 4. Security & CORS Policy Hardening
- **Authentication:** OAuth2 (OIDC) supporting providers like Google. Endpoints protected and JWT validated by Istio/middleware.
- **Identity Extraction:** User identity extracted dynamically from a secure authenticated context (e.g. valid JWT). `X-User-ID` header used only as a temporary dev mechanism.
- **CORS Hardening:**
  - Strict, configurable whitelist-based CORS policy (no wildcard `*` or `Any` in production).
  - Preflight request handling injected via Axum `CorsLayer`.

## 5. Offline Capabilities
The application must leverage **RxDB** to facilitate robust offline synchronization and local-first data flows.
- **Local-First Data Flow:** FE writes to local storage (RxDB) immediately. Background service syncs to Postgres when connection is restored.
- **Outbox Pattern:** Offline actions are queued in an "Outbox" table and processed via Web Background Sync.
- **Delta Sync:** Postgres tables feature `updated_at` and `is_deleted` columns. FE pulls only modified records since the "Last Sync Checkpoint".
- **Self-Healing:** Intercept initialization errors, auto-wipe corrupted local databases, and gracefully degrade to online-only API calls if storage is blocked.

## 6. Startup, Health & Telemetry
- **Startup Checks:** Asynchronous checks ensure dependencies (like Postgres) are reachable before binding the HTTP listener. Refuse to start if unreachable.
- **HaMS Integration:** Serve health/lifecycle endpoints (`/hams/alive`, `/hams/ready`) on port 8079. Synchronous setup before async runtime initialization.
  - Startup checks and HaMS setup must be wrapped in a centralized error handler that applies a configurable `fail_debug_delay` before exiting, allowing container inspection in Kubernetes.
  - Initial health probes (e.g., database connectivity check) must be registered during the synchronous setup phase as non-blocking probes to avoid blocking tokio threads.
  - Link the HaMS shutdown callback (triggered by SIGTERM/SIGINT) to the internal `CancellationToken` (calling `ct.cancel()`).
  - Upon shutdown, HaMS must be explicitly deregistered from Prometheus and stopped to ensure a clean release of system resources.
- **Metrics:** Expose HTTP request metrics automatically via `axum_prometheus`.

## 7. Deployment & Testing
- **Deployment:** Packaged as Docker containers deployed to a Kubernetes cluster via Helm charts.
- **Integration Tests:** Built with Robot Framework, covering all BREAD operations. Tests run with dynamic concurrency grouping to prevent cross-PR queuing and cleanly teardown resources.
- **Workflow Optimization:** Skip integration tests automatically if PRs contain no relevant changes.
- **Multi-Tenancy Verification Test Patterns:**
  - *Data Isolation Test:* Create User A and User B. Create a farm for User A. Log in as User B and verify the farm list is empty. Log in as User A and verify the farm is visible.
  - *Cross-Tenant Access Denial:* Attempt to access, update, or delete User A's farm or field directly by ID using User B's credentials. The system must return 403 Forbidden or 404 Not Found.
  - *Admin Visibility Test:* Log in as an Admin user and verify that farms and fields for both User A and User B are visible via standard endpoints.
  - *Asset Cascading Validation:* Verify that filtering by `user_id` on the `farms` table correctly cascades to all child entities (e.g., fields, events, farm records) so User A cannot see User B's data across all tables.
