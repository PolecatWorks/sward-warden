# Technical Specification: Admin and Support User Switcher and All-Entity Visibility Journey

**State**: Complete

## 1. Overview
This specification details the technical requirements for validating Admin and Support user switching via the top navigation bar header dropdown (`#user-switcher-dropdown`) and verifying all-entity visibility versus specific user isolation.

## 2. Technical Requirements

### 2.1. Header User Switcher Options & Backend Query Parameter Scoping
- In `MainLayoutComponent`, the header user selection dropdown displays:
  - Admin/Support user personas (e.g. `Seamus O'Neill (admin)`, `Support Operator (support)`).
  - Specific tenant user personas (e.g. `John Doe (user)`).
- When an Admin or Support user selects a specific target user:
  - The frontend passes `?user_id=<target_id>` as a query parameter on backend API endpoints (`GET /v0/farms?user_id=<target_id>`, `GET /v0/fields?user_id=<target_id>`, `GET /v0/sync?user_id=<target_id>`).
  - The backend executes SQL filtering (`WHERE user_id = $1 AND is_deleted = FALSE`) directly on the database level, returning only records belonging to the target `user_id`.
  - For standard users (`role: user`), passing a `user_id` query parameter that does not match their authenticated ID returns a `403 Forbidden` error.
- When an Admin or Support persona is selected without a target user filter:
  - The backend returns all active farms and fields across all tenants in the system without `user_id` filtering.

### 2.2. Integration Test (`integration-tests/tests/test_admin_support_user_switch.robot`)
- The Robot Framework integration testing suite must include `test_admin_support_user_switch.robot`:
  1. Pre-create User 1 via API with a farm named `Farm User 1`.
  2. Pre-create User 2 via API with a farm named `Farm User 2`.
  3. Pre-create or retrieve an Admin/Support user via API.
  4. Launch browser and log in as the Admin/Support user.
  5. Verify that on the Farms page, both `Farm User 1` and `Farm User 2` are visible (global view).
  6. Use `#user-switcher-dropdown` to switch to User 1.
  7. Confirm page reloads, displaying `Farm User 1` and confirming `Farm User 2` is NOT visible.
  8. Use `#user-switcher-dropdown` to switch to User 2.
  9. Confirm page reloads, displaying `Farm User 2` and confirming `Farm User 1` is NOT visible.
  10. Use `#user-switcher-dropdown` to switch back to Admin/Support.
  11. Confirm page reloads and both `Farm User 1` and `Farm User 2` are visible again.

## 3. Testing and Verification
- Execute `make robot-test` to confirm all Robot Framework tests pass cleanly.
