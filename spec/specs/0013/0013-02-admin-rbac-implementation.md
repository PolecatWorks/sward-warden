# Spec 0013-02: Backend Role-Based Access Control (RBAC)

## Status: Open

## 1. Overview
The Administration Console requires specific permissions. This spec details the implementation of `Admin` and `Support` roles in the backend to restrict access to administrative APIs.

## 2. Requirements
- Extend the User model or Auth context to include roles.
- Implement middleware/guards in the backend to check for `Admin` or `Support` roles.
- Create specific API endpoints under `/api/admin/*` that are protected by these roles.
- Update the login process to return the user's role in the JWT or session.

## 3. Technical Details
- **Roles**:
  - `User`: Standard access to own data.
  - `Support`: Read-only access to all users, farms, fields, events, and records.
  - `Admin`: Full read/write access to administrative entities and user accounts.
- **Backend (Rust)**:
  - Add `Role` enum to `src/models.rs`.
  - Implement a `require_role` extractor or guard for Axum routes.
  - Create `admin_routes` module.

## 4. Tasks
- [ ] Add `Role` enum to backend models.
- [ ] Implement `RoleGuard` for Axum.
- [ ] Create initial `GET /api/admin/health` endpoint protected by `Role::Support`.
- [ ] Update JWT payload to include `role`.
- [ ] Update frontend `AuthService` to handle roles and protect admin routes.
