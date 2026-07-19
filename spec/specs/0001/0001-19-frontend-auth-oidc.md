# Frontend: OIDC Integration

**State**: Complete

## 1. Overview
This specification details the frontend integration required to support authentication via Keycloak using the standard OpenID Connect (OIDC) Authorization Code Flow with PKCE. The implementation will utilize the technology-specific library `angular-oauth2-oidc` to handle the token lifecycle and communication with the Keycloak Identity Provider.

## 2. Prerequisites
- The frontend environment must be configured to run in a secure context (e.g., `http://localhost:4200` or `https://sward.k8s`) to support the Web Crypto API required for PKCE.
- The `sward-warden-fe` client must be configured in Keycloak (per Spec 0001-17).

## 3. Implementation Details

### 3.1. Library Integration
Integrate the `angular-oauth2-oidc` package into the Angular frontend application (`sw-fe-container`).

- Configure the `AuthConfig` to connect to the Keycloak `sw-dev` realm issuer.
- Set the `clientId` to `sward-warden-fe`.
- Set the `responseType` to `code` to utilize the Authorization Code Flow.
- Enable PKCE (`strictDiscoveryDocumentValidation` may need to be adjusted depending on the local Keycloak setup).
- Define the required scopes (e.g., `openid profile email offline_access`).
- Enable silent refresh (`useSilentRefresh: true`) to automatically renew the access token using the refresh token before it expires, ensuring a seamless user experience.

### 3.2. Authentication Flow
- Update the application initialization logic (e.g., in `APP_INITIALIZER`) to attempt to load the discovery document and try to log the user in automatically if a valid session exists.
- Protect application routes using an `AuthGuard` that redirects unauthenticated users to the Keycloak login page using the `angular-oauth2-oidc` service's `initCodeFlow()` method.
- Handle the callback route (e.g., `/index.html` or a dedicated `/callback` route) to process the authorization code returned by Keycloak and exchange it for tokens.

### 3.3. HTTP Interceptor Updates
Update the existing HTTP interceptor in the frontend to inject the JWT access token into outgoing API requests.

- The interceptor must retrieve the current valid access token from the `angular-oauth2-oidc` service.
- It must inject this token into the `Authorization` header as a `Bearer` token (e.g., `Authorization: Bearer <token>`).
- The interceptor should no longer use or inject the legacy `X-User-ID` or `X-User-Role` headers.
- If a request returns a `401 Unauthorized` response (e.g., if a token expires and silent refresh fails, or the user is suspended), the interceptor should clear the local token state and redirect the user to the login page.

## 4. Acceptance Criteria
- [ ] `angular-oauth2-oidc` is successfully integrated and configured for the Keycloak `sw-dev` realm.
- [ ] The application successfully executes the OIDC Authorization Code Flow with PKCE.
- [ ] Unauthenticated users attempting to access protected routes are redirected to the Keycloak login page.
- [ ] The HTTP interceptor correctly injects the `Authorization: Bearer <token>` header on all outgoing API requests.
- [ ] The application handles `401 Unauthorized` responses by redirecting to the login flow.
- [ ] Silent refresh successfully renews the access token without user intervention.
