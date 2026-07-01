# Technical Specification: Dev User Role Creation Support

**State**: Complete

## 1. Overview
This specification details the backend changes required to support creating and updating users with custom roles (such as 'admin' and 'support') from the developer user creation interface. Currently, user roles default to 'user' in the database because the backend database queries omit the role column when creating or updating users.

## 2. Proposed Changes

### 2.1. Backend (`sw-be-container/src/webserver/users.rs`)
- Modify `create_user` endpoint to bind and insert the `role` field from the incoming `User` payload into the `users` table:
  - Query update: `INSERT INTO users (name, email, role, phone, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, description`
  - Binds update: Bind `&user.role` along with name, email, phone, and description.
- Modify `update_user` endpoint to bind and update the `role` field:
  - Query update: `UPDATE users SET name = $1, email = $2, role = $3, phone = $4, description = $5 WHERE id = $6 RETURNING id, name, email, role, phone, description`
  - Binds update: Bind `&user.role` along with other fields.

### 2.2. Backend Tests (`sw-be-container/src/webserver/tests.rs`)
- Add unit tests for `create_user` verifying that the selected role ('admin', 'support', 'user') is correctly stored in the database and returned by the API.

## 3. Testing and Verification

### 3.1. Automated Tests
- Run backend unit tests: `make sw-be-test`
- Run integration tests: `make robot-test`
