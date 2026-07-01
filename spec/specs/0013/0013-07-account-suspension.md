# Spec 0013-07: Account Suspension & Modules Backend Integration

## Status: In Progress

## 1. Overview
This specification details the backend schema and logic changes required to support aggressive account suspension and subscription-based module gating.

## 2. Requirements
- Add an `is_suspended` flag to the `users` table.
- Create `modules` and `user_modules` tables to track module subscriptions.
- Update the Rust backend authorization middleware to block all access if `is_suspended` is true.
- Update the backend synchronization logic to filter out `reports_and_analysis` module data if the user does not hold the subscription.
- Provide a mechanism to query and update a user's suspension status and modules.

## 3. Technical Details

### 3.1 Database Schema (Migrations)
- Create `0020_account_suspension_and_modules.sql`:
  ```sql
  ALTER TABLE users ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT false;

  CREATE TABLE modules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT
  );

  CREATE TABLE user_modules (
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      module_id INT REFERENCES modules(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, module_id)
  );

  INSERT INTO modules (name, description) VALUES ('reports_and_analysis', 'Access to reporting exports and soil analysis tools.');
  ```

### 3.2 Rust Models (`sw-be-container/src/models.rs`)
- Update `User`:
  ```rust
  pub struct User {
      pub id: i64,
      pub name: String,
      pub email: String,
      pub role: Role,
      pub phone: Option<String>,
      pub description: Option<String>,
      pub is_suspended: bool,
      pub modules: Option<Vec<String>>,
  }
  ```

### 3.3 Authorization Middleware (`sw-be-container/src/webserver/auth.rs`)
- Modify `get_user_role` or create `get_user_auth_info` to fetch both `role` and `is_suspended`.
- In `AdminOnly`, `SupportOnly`, and `UserId` extractors, immediately return `AppError::Forbidden("Account is suspended")` if the user's `is_suspended` status is true.

### 3.4 Data Synchronization (`sw-be-container/src/webserver/sync.rs`)
- In `delta_sync`, query the `user_modules` table to check if the user has the `reports_and_analysis` module.
- If they do not, ensure the arrays for `soil_analyses`, `farm_records`, `fertilisation_plans` (and any future report-specific endpoints) are returned as empty lists, effectively denying sync access to this gated data.

### 3.5 User Endpoints (`sw-be-container/src/webserver/users.rs`)
- Update `list_users`, `get_user`, `create_user`, and `update_user` to correctly join and aggregate the `modules` array and handle the `is_suspended` boolean.
- During `update_user`, implement logic to insert/delete rows in `user_modules` based on the provided array of module names.

## 4. Integration Testing (Robot Framework)
To guarantee the backend correctly enforces these rules, the following Robot test journeys must be implemented in `integration-tests/tests/test_account_suspension.robot`:

- **Account Suspension Cycle API Verification:**
  - Create a test user and verify successful API calls (e.g., fetching profile).
  - Use an Admin API call to update the user to `is_suspended = true`.
  - Attempt the profile fetch again and assert a `403 Forbidden` response.
  - Update the user to `is_suspended = false`.
  - Attempt the profile fetch again and assert a `200 OK` response.

- **Suspension Data Sync Block Verification:**
  - Create a suspended test user.
  - Attempt to send an outbox mutation payload to the `POST /v0/sync/push` endpoint.
  - Assert the request is rejected with `403 Forbidden` and no database mutation occurs.

## 5. Tasks
- [ ] Create `0020_account_suspension_and_modules.sql` migration.
- [ ] Update `User` model in `models.rs`.
- [ ] Implement suspension check in `auth.rs`.
- [ ] Implement module check and filtering in `sync.rs`.
- [ ] Update `users.rs` queries to handle `is_suspended` and `modules` relations.
- [ ] Implement `integration-tests/tests/test_account_suspension.robot`.
