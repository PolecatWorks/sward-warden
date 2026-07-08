# PRD 0014: Development & Testing Tools

## Overview
This document specifies the internal tools, workflows, and configurations used exclusively for development and testing of the application. It consolidates previous requirements covering the Seed Data Generator (0014), Dev Authentication & JWTs (0017, 0020), and CI/CD Testing Pipeline optimizations (0027).

## 1. Seed Data Generator
A standalone Rust CLI application (`tools/`) to populate the backend database with realistic, localized (Northern Ireland) mock data.
- **Workflow:** Generates data (Users -> Farms -> Fields -> Events/Records) by communicating with the backend API over HTTP.
- **Data Fidelity:** Uses data-faking libraries (`fake`, `rand`) to produce realistic farm names, towns, and crop types.
- **Isolation:** Explicitly excluded from production Docker images/binaries.
- **Configuration:** Accepts CLI arguments for target API URL and scale of generation (e.g., number of farms).

## 2. Dev User Authentication & Multi-User Testing
Replaces the simplistic `default-user` fallback with explicit development-only authentication to properly test multi-tenant data segregation.
- **Dev Login UI (`/login`):** A dev-only frontend view fetching available seeded users and allowing the developer to select a persona to log in. Includes an inline form to create new test users dynamically.
- **User Deletion:** Provides a dev-only ability to delete a user (and cascade delete their data) via a UI trashcan icon and backend `DELETE /v0/users/{id}` endpoint. Clicking delete must stop click propagation (not trigger login). The backend must clear the backend farms cache for that user. This capability is restricted to development environments and must return `403 Forbidden` in production.
- **Header Switcher:** The main layout top bar provides a dropdown to instantly switch the active dev user, triggering a fresh JWT fetch and app reload.

## 3. Dev JWT Authentication
Brings the local dev environment closer to production architecture by using real JWTs instead of plain HTTP headers (`X-User-ID`).
- **Key Generation:** Backend generates an in-memory RSA keypair (RS256) on startup (dev mode only) using `jwt_simple`.
- **Endpoints (Dev Only):**
  - `POST /dev/auth/token`: Signs and returns a JWT for a selected User ID and roles.
  - `GET /.well-known/jwks.json`: Exposes the public key for local Istio service mesh validation.
- **Security Constraint:** Dev endpoints and key-generation logic are strictly disabled in production. They must be explicitly enabled via `debugging.enable_dev_auth = true` in config.
- **Middleware:** Backend middleware parses the `Authorization: Bearer <token>` header, verifies the signature, and extracts claims (`sub`, `sward_roles`).
- **Frontend HTTP Interceptor:** Update the HTTP interceptor to inject the JWT as an `Authorization: Bearer <token>` header on all outgoing API requests instead of using `X-User-ID` and `X-User-Role` headers.
- **Token Expiration & 401 Handling:** Handle token expiration by clearing the token and redirecting the user back to the Dev Login UI if a `401 Unauthorized` response is received.

## 4. Integration Testing Pipeline Optimization
Optimizations for the Robot Framework integration testing CI/CD pipeline.
- **Shallow Clone:** The GitHub Actions checkout for the `gh-pages` branch (used for test reports) must use `fetch-depth: 1` to prevent slow historical checkouts.
- **Parallelization:** Move the `gh-pages` checkout, preparation, and old PR pruning steps to run before or concurrently with the integration tests, decoupling them from post-test processing to minimize total workflow time.
- **Rust Documentation:** Generate Rust backend documentation (`cargo doc --no-deps`) and publish to the `gh-pages` branch (`docs/rust` directory) during the CI publish process (e.g., in `.github/workflows/sw-be-docker-publish.yml`). Ensure previous files are kept (`keep_files: true`).
- **E2E UI & Backend Verification Journey (`test_ui_api_sync.robot`)**: The integration testing suite must include a comprehensive end-to-end journey test that validates UI and Backend synchronization. Users can use the UI to create a farm and a field, and the test confirms their existence in both the UI and backend API. The test then deletes the field and farm via the API, forces a UI sync to ensure removal from the UI, and finally creates a new farm and field via the API to confirm they are visible in the UI.
