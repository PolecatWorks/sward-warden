# Technical Specification: Dev User Authentication & Multi-User Testing

**State**: Complete

## 1. Overview
This specification details the implementation of a development-only user authentication mechanism. It replaces the hardcoded fallback to `default-user` with a dynamic user selector page and authentication guard, enabling testing of data segregation and multi-user scenarios.

## 2. Changes

- **`sw-fe-container/src/app/services/auth.service.ts`**: Replaces the hardcoded `default-user` logic with explicit login and logout methods, saving the selected userId to `localStorage`.
- **`sw-fe-container/src/app/services/auth.guard.ts`**: Introduces a route guard that redirects unauthenticated users to `/login`.
- **`sw-fe-container/src/app/login/`**: Creates the `LoginComponent` allowing selection of seeded users fetched from backend `/v0/users`.
- **`sw-fe-container/src/app/app.routes.ts`**: Applies `authGuard` and registers `/login` route.
- **`sw-fe-container/src/app/home/`**: Displays user-specific greeting and profile statistics.
- **`sw-fe-container/src/app/main-layout/`**: Fetches user info dynamically and provides a logout action, while preserving the local storage database fallback warning banner.
- **`sw-be-container/src/webserver/mod.rs`**: Cleaned up routing imports.

## 3. Testing
- Added/updated mocks for unit testing of routing and components.
- Fixed database contamination flakiness in RxDB tests by using `useFactory` instead of a shared `useValue` instance of `getRxStorageMemory()`.
