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

### Fe Development (`sw-fe-container`)

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

### Be Development (`sw-be-container`)

The be is built in Rust using the Axum framework. It serves main HTTP traffic on port `8080` and exposes Kubernetes lifecycle checks (liveness, readiness, startup, shutdown) under `/hams/*` on port `8079`.

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

* `make test` - Runs be tests safely (single-threaded).
* `make build-fe` - Builds the Docker image for the fe.
* `make build-be` - Builds the Docker image for the be.
* `make helm-package` - Packages the Helm chart into the `charts/` directory.
* `make helm-deploy` - Upgrades or installs the packaged Helm chart.
* `make all` - Builds fe, be, and packages the Helm chart.
