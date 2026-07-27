# Project Overview

This app is about helping farmers to manage their sward use and keep with the guidelines and also to optimize their use of sward taking account of weather and runoff. It will consider topology and runoff into rivers and waterways.

This project uses a Product Requirements Document (PRD) driven approach to development.

All PRDs are stored in `spec/prds/`. These PRDs are analyzed to ensure there are no contradictions or ambiguities. Once validated, they are broken down into detailed technical specifications stored in `spec/specs/`. Only when we have robust specifications can we begin development using a Test-Driven Development (TDD) pattern.

Please read `agents.md` for information on our workflow and development patterns.

## Prerequisites

Before beginning development, ensure you have the following installed:
* **Rust / Cargo**: For be development (`sw-be-container`).
* **Node.js / npm**: For fe development (`sw-fe-container`).
* **Docker**: For building container images.
* **Helm**: For Kubernetes deployment packaging.
* **Make**: To run Makefile targets.
* **PostgreSQL**: Be database (can also be run locally via Docker).

## Development Setup & Running

You can run the application in two execution modes: **Minimal Standalone Dev Auth mode** (default, local mock auth) or **Keycloak OIDC Auth mode**.

### 1. Minimal Standalone Dev Auth Mode (Default)

In this mode, local development authentication bypasses Keycloak OIDC and uses simulated dev tokens (`/dev/auth/token`).

1. **Start Database**:
   ```bash
   make compose-db
   ```
2. **Start Backend (Dev Auth)**:
   ```bash
   make sw-be-dev
   ```
3. **Start Frontend (Dev Auth)**:
   ```bash
   make sw-fe-dev
   ```
4. **Run Robot Tests (Minimal Mode)**:
   ```bash
   # Run all integration tests against Minimal Dev Auth setup
   make robot-test

   # Run backend API tests only
   make robot-test-be
   ```

---

### 2. Keycloak OIDC Auth Mode

In this mode, authentication flows through Keycloak OIDC identity management.

1. **Start Database**:
   ```bash
   make compose-db
   ```
2. **Start Backend (Keycloak Mode)**:
   ```bash
   make sw-be-dev-keycloak
   ```
3. **Start Frontend (Keycloak Mode)**:
   ```bash
   make sw-fe-dev-keycloak
   ```
4. **Run Robot Tests (Keycloak Mode)**:
   ```bash
   # Run all integration tests with Keycloak OIDC enabled
   make robot-test-keycloak
   ```

---

### Component-Level Development

#### Fe Development (`sw-fe-container`)

The fe is an Angular application.

1. Navigate to the fe directory:
   ```bash
   cd sw-fe-container
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (available at http://localhost:4200):
   ```bash
   npm start
   ```
4. **Testing**: To run fe Angular tests headlessly, use:
   ```bash
   npm test -- --watch=false --browsers=ChromeHeadless
   ```

#### Be Development (`sw-be-container`)

The be is built in Rust using the Axum framework. It serves main HTTP traffic on port `8080` and exposes Kubernetes lifecycle checks (liveness, readiness, startup, shutdown) under `/hams/*` on port `8079`.

Rust documentation is published at: [Rust Code Documentation](https://polecatworks.github.io/sward-warden/docs/rust/sw_be_container/index.html).

1. Navigate to the be directory:
   ```bash
   cd sw-be-container
   ```
2. Run the be server:
   ```bash
   cargo run -- serve
   ```
3. **Testing**: Rust tests that modify environment variables must be executed single-threaded to prevent race conditions and test panics. Run tests via:
   ```bash
   cargo test -- --test-threads=1
   ```

## Make Commands

The repository uses specific `Makefile` targets to coordinate builds and testing. All major development actions should be triggered via these targets:

* `make robot-test` - Runs all robot integration tests against standard local dev.
* `make robot-test-keycloak` - Runs all robot integration tests with Keycloak OIDC enabled.
* `make robot-test-be` - Runs backend API robot integration tests.
* `make robot-test-cleanup` - Purges orphaned test data created by automated tests.
* `make test` - Runs backend Rust unit/integration tests safely (single-threaded).
* `make build-fe` - Builds the Docker image for the fe.
* `make build-be` - Builds the Docker image for the be.
* `make helm-package` - Packages the Helm chart into the `charts/` directory.
* `make helm-deploy` - Upgrades or installs the packaged Helm chart.
* `make all` - Builds fe, be, and packages the Helm chart.

# Garden

do this before running garden


   ```bash
   export GHCR_READER_TOKEN=$(kubectl get secret ghcr-secret-reader-token -n sward-warden-dev -o jsonpath="{.data.token}" | base64 --decode)
   ```
