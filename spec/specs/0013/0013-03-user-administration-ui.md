# Spec 0013-03: User Administration UI

## Status: Open

## 1. Overview
Support staff and admins need to view and search for users to provide assistance. This spec details the UI for managing users in the Admin Console.

## 2. Requirements
- User listing page with pagination.
- Search functionality (by name or email).
- User details view showing account status and associated farms.
- Visual indicator for user roles.

## 3. Technical Details
- **Frontend Components**:
  - `UserListComponent`: Table showing ID, Name, Email, Role, Created Date.
  - `UserSearchComponent`: Input field with debounce for searching.
  - `UserDetailsComponent`: Detailed view of a selected user.
- **Backend API**:
  - `GET /api/admin/users`: Paginated list of users.
  - `GET /api/admin/users/:id`: Single user details with farm summaries.

## 4. Tasks
- [ ] Implement `GET /api/admin/users` endpoint.
- [ ] Implement `GET /api/admin/users/:id` endpoint.
- [ ] Create `UserListComponent` in `sw-admin-container`.
- [ ] Create `UserDetailsComponent` in `sw-admin-container`.
- [ ] Integrate search functionality.
