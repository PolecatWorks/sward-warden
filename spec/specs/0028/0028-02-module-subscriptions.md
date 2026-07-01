# Spec 0028-02: Account Suspension & Modules Frontend

## Status: In Progress

## 1. Overview
This specification details the frontend changes required to support module route guarding and the Administration Console interface for managing account suspension and modules.

## 2. Requirements
- The user application (`sw-fe-container`) must protect the `/reporting` and `/soil-analysis-results` routes if the `reports_and_analysis` module is not subscribed.
- The user application must handle 403 Forbidden errors globally (or in the sync engine) if the account becomes suspended, logging the user out or showing a "Suspended" view.
- The Admin Console (`sw-admin-container`) must display and allow modification of a user's `is_suspended` status and their active modules.

## 3. Technical Details

### 3.1 User Frontend (`sw-fe-container`)
- **Route Guard:** Create `module.guard.ts` that inspects the currently logged-in user's profile (which must now include the `modules` array). If a requested route requires `reports_and_analysis` but the user lacks it, redirect to `/home`.
- **Navigation UI:** Update `MainLayoutComponent` to conditionally render the "Reporting" sidebar link only if the user has the required module.
- **Suspension Handling:** Ensure `devAuthInterceptor` or `sync-engine.service.ts` gracefully handles `403 Forbidden` responses. If a 403 explicitly indicates account suspension, the application should force a logout or render a static "Account Suspended" overlay.

### 3.2 Admin Console (`sw-admin-container`)
- **User Service (`user.service.ts`):** Update the `User` interface to include `is_suspended: boolean` and `modules: string[]`. Add methods for toggling suspension and updating modules (e.g., calling `PUT /v0/users/{id}`).
- **User List Component (`user-list.html` / `user-list.ts`):**
  - Add visual indicators for `is_suspended` status.
  - Display the list of active modules as inline tags.
  - Add action buttons or a modal dialog to toggle suspension status and check/uncheck module subscriptions.

## 4. Tasks
- [ ] Implement `module.guard.ts` in `sw-fe-container`.
- [ ] Apply `module.guard.ts` to reporting and analysis routes in `app.routes.ts`.
- [ ] Update `MainLayoutComponent` navigation to be module-aware.
- [ ] Update `sw-admin-container` `User` interface.
- [ ] Update `UserListComponent` to display suspension and module states.
- [ ] Implement toggle actions for suspension and modules in `UserListComponent` and connect them to backend API.
