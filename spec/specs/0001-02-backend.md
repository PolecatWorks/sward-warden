# 0001-02 Backend Specification

**State**: Complete

## Scope
This specification covers the implementation details of the backend application as outlined in PRD 0001.

## Technical Stack
- **Language**: Rust
- **Web Framework**: Axum
- **Database**: PostgreSQL (relational storage)
- **Location**: All source code will reside in `sw-be-container/`

## Deployment Strategy
- The application will be packaged into a Docker container.

## Architecture Guidelines
- Must strictly adhere to 12-factor application principles.
- Security, authentication, and authorization are deferred to Istio (part of Kubernetes cluster deployment).

## App Framework & Configuration
- **Configuration**: Managed via YAML files, with support for secret files and environment variable overrides.
- **CLI Commands**:
  - `serve`: Start the main application server.
  - `version`: Display application version.
  - `migrate`: Execute schema migrations against PostgreSQL.

## Networking
- **Application Server**: Listens on port 8080.
- **Lifecycle/Health**: Serves liveness, readiness, startup, shutdown, and health events on port 8079.

## Expected Workflows
- TDD should be practiced using Rust testing frameworks.
- Development processes (e.g., cargo build, cargo test) will be managed through `Makefile` targets.
