# PRD: 0017 Dev User Authentication & Multi-User Testing

## Title: Implementation of Development User Authentication and Multi-User Testing Support

## 1. Problem Statement
Currently, the application defaults to a generic `default-user` identity during development and testing. This approach has significant limitations:
- It masks real-world user data segregation issues.
- It prevents developers from easily testing the application from the perspective of different users (e.g., verifying that User A cannot see User B's farms).
- It hardcodes user details (like "Seamus O'Neill") in the UI rather than reacting dynamically to the active user context.
- The `default-user` string ID creates type mismatches with the backend, which expects numeric IDs.

To improve the development experience and ensure the correctness of multi-tenant data access, the app needs a reliable way to switch between real seeded users during development.

## 2. Goal
Replace the automatic `default-user` fallback with an explicit development-only authentication mechanism. This allows developers to explicitly select which seeded user they are impersonating, enabling rigorous testing of multi-user scenarios and data segregation without the overhead of setting up a full Identity Provider (IdP) like Keycloak locally.

## 3. Scope of Work

### 3.1. Authentication Service Updates
- Modify the `AuthService` in the frontend so that `getUserId()` no longer injects a default user.
- If no user is logged in, `getUserId()` should return `null` or a similar falsy value indicating an unauthenticated state.
- Implement explicit `login(userId)` and `logout()` functionalities to manage the `localStorage` state.

### 3.2. Development Login View (`/login`)
- Create a new, simple login page intended purely for development use.
- This page must fetch the list of available seeded users from the backend (`GET /users` via `FarmManagementService.getUsers()`).
- The page should present these users in a list or dropdown, allowing the developer to click/select one to log in.
- Upon selection, the app saves the selected user's ID via `AuthService` and redirects the user to the main application (e.g., `/home`).
- **User Creation:** Provide an inline, toggleable creation form (Name, Email, Role, Phone, Description) to dynamically create new users via `POST /v0/users` in cases where the database has just been reset or needs custom test profiles.
- **Error Handling:** If fetching users from the backend fails (e.g. server is down), display a clear, informative error message prompting the user to check if the backend service is running instead of hanging on "Loading users...".


### 3.3. Routing and Guard Updates
- Implement a basic route guard (or application initialization logic) that checks if a user is authenticated.
- If unauthenticated, redirect the user to the new `/login` page.
- Ensure the `/login` route is excluded from this guard to prevent infinite redirect loops.

### 3.4. Header User Switcher (Dev Tools)
- Update the main layout header to replace the hardcoded "Seamus O'Neill" profile info with dynamic data based on the currently authenticated user.
- Add a "Switch User" UI mechanism (e.g., a dropdown near the profile picture, or a dedicated developer button) in the top navigation bar.
- This switcher allows the developer to instantly change their active user without navigating back to the `/login` page. Selecting a different user should update the auth state and force a reload/refresh of the app data context.

### 3.5. Dynamic User Profile Integration
- Ensure that the frontend components (e.g., Home, Main Layout, User Profile) fetch and display the correct current user's data (name, email, etc.) based on the ID returned by `AuthService`.
- Remove hardcoded logic that accommodates `default-user` in places like `user-profile.component.ts`.

## 4. Non-Goals
- Implementing a production-ready Identity Provider (IdP) integration (like Keycloak, Auth0, etc.). This PRD is strictly about solving the local development and testing workflow.
- Implementing complex Role-Based Access Control (RBAC) UI elements. While users might have roles in the database, this task is focused on *identity selection* and data segregation (seeing the right farms), not necessarily building distinct Admin vs. User UI flows unless they naturally fall out of the data segregation.

## 5. Technical Considerations
- **Environment:** The new login page and switcher are primarily dev tools, but they should be implemented in a way that is easily disabled or replaced when real authentication is added for production later.
- **User Directory Privacy & API Restrictions**: Listing all users (`GET /users`) is strictly blocked on the backend in production/non-development environments. The user-switcher and user list dropdown features must be restricted (e.g. via environment flags or middleware) so they are only enabled in the local development/testing context.
- **State Management:** When a user switches identity, the frontend state (including RxDB local databases if they are partitioned by user, or at least the active queries) needs to reset or re-query to prevent data leakage between user sessions in the UI. A simple page reload (`window.location.reload()`) upon switching users is acceptable for this development-tier feature.
- **Backend Compatibility:** The backend currently trusts the `X-User-ID` header (as seen in `chat.service.ts` or auth middleware). The updated `AuthService` must ensure it passes the numeric ID of the selected seeded user correctly.
