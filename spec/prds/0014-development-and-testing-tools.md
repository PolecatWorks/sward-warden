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
Local development supports two distinct authentication execution modes:

### Mode A: Standalone Dev Auth (Shortcut / Mock Mode)
Allows developers to run the frontend and backend without running Keycloak locally.
- **Enabled via:** `debugging.enable_dev_auth = true` in backend configuration.
- **Makefile Targets:** Executed via `make sw-be-dev` and `make sw-fe-dev`.
- **Dev Login UI (`/login`):** A dev-only frontend view fetching available seeded users and allowing the developer to select a persona to log in. Includes an inline form to create new test users dynamically.
- **User Deletion:** Provides a dev-only ability to delete a user (and cascade delete their data) via a UI trashcan icon and backend `DELETE /v0/users/{id}` endpoint. Clicking delete must stop click propagation (not trigger login). The backend must clear the backend farms cache for that user. Restricted to development environments and must return `403 Forbidden` in production.
- **Header Switcher / User Selection:** The main layout top bar provides a dropdown to switch the active user, triggering a fresh token/JWT fetch and app reload. The dropdown is visible when local dev auth mode is enabled OR if the authenticated user has an `admin` or `support` role. When an admin or support persona is selected, the application displays global system data (all farms and fields across all users). When a specific tenant user persona is selected, all entity and sync filtering is executed directly on the backend via SQL database queries (using `user_id` query parameters on `/v0/farms`, `/v0/fields`, and `/v0/sync`), returning only that target user's records.

### Mode B: Local Keycloak Auth Mode (Full OIDC Integration Flow)
Includes Keycloak directly in the local development login flow to validate real OIDC redirects, PKCE, token refresh, and user onboarding before deployment.
- **Enabled via:** `debugging.enable_dev_auth = false` in backend configuration, with local Keycloak OIDC issuer/JWKS parameters.
- **Makefile Targets:** Executed via `make sw-be-dev-keycloak` and `make sw-fe-dev-keycloak`.
- **Configurable Keycloak Endpoint:** The Makefile provides default Keycloak realm endpoints (e.g. `KEYCLOAK_URL ?= http://keycloak.k8s` and `KEYCLOAK_REALM_URL ?= http://keycloak.k8s/auth/realms/sw-dev`), which can be overridden via environment variables (e.g., `KEYCLOAK_URL=https://custom-keycloak-dev.example.com make sw-fe-dev-keycloak`).
- **OIDC Flow:** The frontend `/login` page initiates standard OIDC Authorization Code Flow with PKCE against the local Keycloak instance, handling redirect flows, authorization codes, and token exchanges.

## 3. Dev JWT Authentication (Standalone Mode)
Brings the standalone local dev environment closer to production architecture by using real JWTs instead of plain HTTP headers (`X-User-ID`).
- **Key Generation:** Backend generates an in-memory RSA keypair (RS256) on startup (when `debugging.enable_dev_auth = true`) using `jwt_simple`.
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
- **E2E UI & Backend Verification Journey (`test_ui_api_sync.robot`)**: The integration testing suite must include a comprehensive end-to-end journey test that validates UI and Backend synchronization:
  - The journey must use the UI to create a farm and a field.
  - It must confirm the newly created farm and field exist via the UI.
  - It must confirm the newly created farm and field exist via the backend API.
  - It must delete the field via the API, force a UI sync, and confirm it is removed from the UI.
  - It must delete the farm via the API, force a UI sync, and confirm it is removed from the UI.
  - It must create a new farm via the API and confirm it is visible in the UI.
  - It must create a new field via the API and confirm it is visible in the UI.

## 5. User Journeys
The following user journeys validate development and testing capabilities:

- **Dev User Switch and Sync Invalidation Journey (`test_dev_user_switch.robot`)**: The integration testing suite must include a development user switching and data sync isolation journey. The journey must pre-create a farm ("Farm 1") via the API for a first user, log in to the UI as that user, and verify the farm is visible on the Farms page. It must register a second user via the UI, use the header user-switcher dropdown to switch to the second user, and verify the Farms page reloads to show an empty state ("No farms yet"). It must then switch back to the first user via the dropdown and verify "Farm 1" is visible again. Finally, the journey must simulate an out-of-band user change by manually modifying local storage values (user ID and token) to a newly created user with no farms, trigger a force sync by clicking the sync status UI indicator, verify that the UI refreshes to show an empty state ("No farms yet") and "Farm 1" is removed, and clean up all created users and farms via API delete calls.
- **Admin and Support User Switcher and All-Entity Visibility Journey (`test_admin_support_user_switch.robot`)**: The integration testing suite must include a Robot Framework test verifying dropdown functionality and visibility for admin and support users. The journey pre-creates farms for User 1 and User 2 via the API, logs in as an Admin/Support user, and verifies that the Admin/Support view displays all farms across all users. It then selects User 1 in the header user selection dropdown and verifies the page reloads to display only User 1's farm. It selects User 2 and verifies only User 2's farm is visible. Finally, it selects the Admin/Support persona from the dropdown, confirms that all farms across all users are visible again, and cleans up all created users and farms via API delete calls.

## 7. Keycloak Integration Test Execution & Automated Test Data Cleanup
Integration tests must support flexible execution environments and maintain database hygiene:
- **Authentication Execution Modes:** Tests must be capable of running either with Standalone Dev Auth enabled (`debugging.enable_dev_auth = true`) or with Keycloak OIDC Auth enabled (`debugging.enable_dev_auth = false`). The test HTTP library (`AuthRequests.py`) dynamically detects or accepts configuration for Keycloak OIDC parameters (`ENABLE_KEYCLOAK`, `KEYCLOAK_URL`, `KEYCLOAK_REALM_URL`) to fetch valid OIDC JWT tokens when Keycloak mode is enabled, while continuing to fallback to `/dev/auth/token` when Standalone Dev Auth mode is enabled.
- **In-Test Resource Teardown:** Every integration test case creating test entities (Users, Farms, Fields, Events, Soil Analyses, Storage Capacities, Sward Movements) must register created entity IDs and clean them up via `[Teardown]` hooks or explicit API delete calls upon test completion (whether passed or failed) so no test artifacts remain in the database.
- **Stale & Orphaned Test Data Cleanup Mechanism:** Provide an automated cleanup suite/script that can be run on demand or post-testing to identify and sweep orphaned or leftover test-generated entities (e.g. entities matching test prefixes such as `Test Farm`, `Test User`, or `robot_*`) across the backend API.
