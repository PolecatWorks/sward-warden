# 0001-22 Frontend: Sync Engine Authentication Guard & OIDC Flow Preservation

**State**: Complete

## 1. Overview
This specification addresses an issue where the background synchronization engine (`SyncEngineService`) runs prematurely upon application launch before identity verification or OIDC token acquisition completes. In production/dev-mesh environments where endpoints are secured by Istio `AuthorizationPolicy` and zero-trust backend signature verification (per Spec 0001-21), unauthenticated sync requests produce `403 Forbidden` errors that route the browser to the error page, breaking the login and callback flows.

## 2. Motivation & Architectural Objectives
1. **Prevent Unauthenticated Sync Calls**: `SyncEngineService` must not attempt network sync requests (`/sward/v0/sync`) when no valid user session or token exists.
2. **Preserve Authentication and Callback Navigation**: Sync failures or unauthenticated states must never preempt OIDC authorization code exchange or interrupt the user login workflow.
3. **Reactive Sync Activation on Login**: When a user successfully authenticates (via Keycloak SSO code flow or local dev authentication), `SyncEngineService` must reactively initiate synchronization.
4. **Clean Token Lifecycle Separation**: The HTTP interceptor (`devAuthInterceptor`) must not synthesize legacy/unauthenticated headers (`X-User-ID`, `X-User-Role`) when OIDC is configured, and must cleanly route expired/unauthorized sessions to `/login` without triggering synchronization crash loops.

## 3. Detailed Technical Requirements

### 3.1. SyncEngineService Authentication Gate
- In `sw-fe-container/src/app/services/sync-engine.service.ts`:
  - Guard `fullSync()`: At the entry of `fullSync()`, verify `this.authService.isLoggedIn()` (or that a valid token exists). If the user is not authenticated, abort the sync cycle immediately and quietly without raising error notifications or navigating to `/error`.
  - Filter sync triggers: In the trigger pipelines (`onlineEvent$`, `periodicSync$`, `outboxTrigger$`), filter out events when `!this.authService.isLoggedIn()`.
  - Listen for authentication state changes: Subscribe or react to user login events so that when a session becomes active, a sync cycle is triggered automatically.

### 3.2. Error Handling & Navigation Decoupling
- In `handleSyncError()`:
  - If a 401 Unauthorized or 403 Forbidden occurs during sync and the user is either on `/login` or attempting OIDC callback (`code=` / `state=` in URL), do not navigate to `/error`.
  - Avoid destructive redirects that wipe OAuth state or prevent token exchange.

### 3.3. Service Worker API Glob Patterns
- In `sw-fe-container/ngsw-config.json`:
  - Ensure API route prefix `!/sward/**` is excluded from Service Worker navigation routing alongside `!/auth/**`, `!/api/**`, and `!/hams/**`.

## 4. Acceptance Criteria
- [ ] `SyncEngineService` does not issue requests to `/sward/v0/sync` while unauthenticated.
- [ ] Users visiting the app while unauthenticated remain on or are redirected to `/login` without encountering a 403 Synchronization Issue screen.
- [ ] Keycloak SSO login redirects to Keycloak, completes the authorization code exchange, and successfully lands on the authenticated view.
- [ ] Once authenticated, `SyncEngineService` triggers synchronization and successfully exchanges data.
- [ ] All frontend unit tests pass.
