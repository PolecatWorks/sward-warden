# Specification 0020-02: Dev JWT Authentication (Frontend)

## 1. Overview
This specification details the frontend implementation required to support Dev JWT Authentication, replacing the usage of hardcoded `X-User-ID` headers with Bearer tokens retrieved from the backend's dev authentication endpoint.

## 2. Dev Login Flow & UI

### 2.1 Interface
- **Dev User Switcher:** Extend the existing Header User Switcher or Dev User Creation UI to support "logging in".
- **Interaction:** When a developer selects a mock persona (e.g., "User A" or "Admin B") from the Dev UI, the frontend triggers an authentication flow.

### 2.2 Token Acquisition
- **Service Update:** The `DevAuthApiService` must perform a `POST` request to the new backend endpoint `/dev/auth/token`.
- **Payload:** Send the selected user's ID and associated roles in the request body.
- **Storage:** Upon receiving the JWT response, store the token securely.
  - Store the JWT in `localStorage` under the key `dev-jwt-token`.
  - Store the active user ID under `agent-user-id` (maintaining current state for local caching if needed).

## 3. HTTP Interceptor Update

### 3.1 `devAuthInterceptor`
- **Current Behavior:** Injects `X-User-ID` and `X-User-Role` headers.
- **New Behavior:**
  - Retrieve the `dev-jwt-token` from `localStorage`.
  - If the token exists, inject the header: `Authorization: Bearer <dev-jwt-token>`.
  - Ensure the legacy dev headers (`X-User-ID`, etc.) are completely removed from outgoing requests.

### 3.2 Token Expiration Handling
- The interceptor (or a dedicated error handler) must monitor for `401 Unauthorized` responses.
- Since dev tokens expire (e.g., 24h, or on backend restart since keys are in-memory), receiving a 401 should trigger a clearing of the `dev-jwt-token` and `agent-user-id` from local storage.
- The UI should gracefully prompt the developer to select a user persona again via the Dev Login interface.
