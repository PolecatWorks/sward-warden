# Specification: Integration Test Keycloak Execution & Test Data Cleanup

## Status
Complete

## Target PRD
PRD 0014

## Overview
This specification defines the mechanics for executing Robot integration tests seamlessly against environments with Keycloak OIDC auth enabled or Standalone Dev Auth enabled. It also establishes teardown cleanup standards across all test suites and specifies an automated stale/orphaned test data cleanup mechanism.

---

## 1. Dual-Mode Authentication Support in Tests (`AuthRequests.py`)

1. **Environment & Variable Detection**:
   - `ENABLE_KEYCLOAK` boolean variable (default: `${FALSE}`).
   - `KEYCLOAK_URL` and `KEYCLOAK_REALM_URL` parameters.
2. **Token Fetching Strategy**:
   - When `ENABLE_KEYCLOAK` is `${FALSE}` (Standalone Dev Auth Mode): `AuthRequests.py` requests `/dev/auth/token` with requested `user_id` and `role`.
   - When `ENABLE_KEYCLOAK` is `${TRUE}` (Keycloak Mode): `AuthRequests.py` fetches the token from `${KEYCLOAK_REALM_URL}/protocol/openid-connect/token` using dev credentials or standard user tokens.

---

## 2. In-Test Teardown & Cascading Resource Cleanup

1. **Teardown Hooks**:
   - Every Robot test case creating entities (Users, Farms, Fields, Events, Soil Analyses, Storage Capacities, Sward Movements) must declare `[Teardown]` logic.
   - When a resource is created in a test, its ID is tracked.
   - Teardown attempts to delete created sub-entities first, followed by parent entities (e.g. Field -> Farm -> User), using standard `DELETE` endpoints (`DELETE /v0/fields/{id}`, `DELETE /v0/farms/{id}`, `DELETE /v0/users/{id}`).

---

## 3. Stale & Orphaned Test Data Cleanup Mechanism

1. **Automated Cleanup Runner**:
   - A dedicated Python/Robot cleanup tool (`cleanup_stale_test_data.py` or `make robot-cleanup`) queries existing users, farms, fields, and records via admin/support or standard API endpoints.
   - Entities matching test naming patterns (e.g., `name` starting with `Test `, `robot_`, or created during automated test execution) are purged via cascading deletion endpoints (`DELETE /v0/users/{id}` or `DELETE /v0/farms/{id}`).
2. **CLI & Makefile Integration**:
   - Add target `make robot-test-cleanup` in the root `Makefile` to trigger the cleanup sweep on demand.
