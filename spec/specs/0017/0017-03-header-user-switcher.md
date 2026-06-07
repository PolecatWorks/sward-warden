# Technical Specification: Header User Switcher (Dev Tools)

**State**: Complete

## 1. Overview
This specification details the frontend changes required to implement a Header User Switcher. This switcher enables developers to quickly change the active user directly from the top navigation bar during local development and testing, without having to log out or return to the `/login` page.

## 2. Proposed Changes

### 2.1. `sw-fe-container/src/app/main-layout/main-layout.component.ts`
- Leverage the existing `FarmManagementService` injection.
- Declare a property `users$: Observable<User[]>` to hold the list of all seeded users.
- Initialize `users$` in `ngOnInit` by calling `this.farmManagementService.getUsers()`.
- Add a new method `switchUser(userId: string | number): void`:
  - Call `this.authService.login(userId.toString())` to update the active user context in local storage.
  - Call `window.location.reload()` to force a reload/refresh of the application context and reset any active queries or databases.

### 2.2. `sw-fe-container/src/app/main-layout/main-layout.component.html`
- In the top header bar, next to the active user's profile image and greeting, introduce an interactive dropdown selector element.
- Bind the dropdown options to the `users$ | async` stream:
  - Each option displays the user's name and role (e.g., "John Doe (Admin)").
  - Set the active option to the current user's ID.
- Listen for change events on the dropdown to invoke `switchUser(selectedUserId)`.
- Ensure the dropdown matches the premium design system (clean typography, HSL/emerald green accents, and proper dark mode support).

## 3. Testing and Verification

### 3.1. Unit Tests (`sw-fe-container/src/app/main-layout/main-layout.component.spec.ts`)
- Add tests to verify that:
  - The component fetches seeded users on initialization.
  - The dropdown renders all fetched users.
  - Selecting a user calls `AuthService.login()` with the correct ID.
  - A page reload is successfully requested upon switching users.
