# Backend: Auth Middleware & Istio Integration

**State**: Planned

## 1. Overview
This specification details the updates required for the SwardWarden Rust backend (`sw-be-container`) to support authentication when running behind an Istio service mesh that acts as the primary OIDC token verifier.

Instead of performing cryptographic validation of the JWT on every request, the backend will trust the Istio mesh. Istio will validate the JWT signature via Keycloak and pass the decoded payload down to the backend in a specific HTTP header (`x-jwt-payload`), while preserving the original `Authorization: Bearer <token>` header for any downstream needs.

## 2. Prerequisites
- The GitOps infrastructure changes (Spec 0001-17) must be deployed so that Istio injects the `x-jwt-payload` and forwards the original token.

## 3. Implementation Details

### 3.1. Auth Middleware Updates
Update the Axum middleware responsible for extracting user identity (e.g., `sw-be-container/src/middleware/auth.rs` or similar).

- **Header Extraction**:
  - The middleware must attempt to read the `x-jwt-payload` HTTP header.
  - If present, the middleware should decode the Base64-encoded JSON payload.
  - From the decoded payload, extract the `sub` (User ID) and the `sward_roles` array.
  - Construct the internal authenticated user context (`UserContext` or similar struct injected into Axum handlers) using these claims.

- **Original Token Retention**:
  - The middleware should also extract the original `Authorization: Bearer <token>` header and store it in the request extensions or the `UserContext`. This ensures the raw token is available if the backend needs to make authenticated requests to other services (like Keycloak Admin API) on behalf of the user.

- **Missing Header Handling**:
  - If the `x-jwt-payload` header is missing, the backend should return a `401 Unauthorized` response (unless Dev Auth fallback is active, see 3.2).

### 3.2. Local Development Fallback (Mock Auth)
To support local development without requiring a full Keycloak and Istio setup, the existing Mock Dev Auth system (`debugging.enable_dev_auth: true`) must be preserved as a fallback.

- **Fallback Logic**:
  - If `debugging.enable_dev_auth` is `true`, and the `x-jwt-payload` is missing, the middleware should fall back to standard JWT signature validation using the locally generated in-memory RSA keypair (the current behavior).
  - If `debugging.enable_dev_auth` is `false`, the backend must strictly rely on the Istio-injected header and reject requests without it.

## 4. Acceptance Criteria
- [ ] Backend middleware successfully parses the `x-jwt-payload` header injected by Istio.
- [ ] The `sub` and `sward_roles` claims are correctly extracted and populated into the request context.
- [ ] The original `Authorization` token is extracted and available in the request context.
- [ ] In production (`enable_dev_auth: false`), requests missing the `x-jwt-payload` are rejected with `401 Unauthorized`.
- [ ] In development (`enable_dev_auth: true`), requests with a valid local mock JWT but missing `x-jwt-payload` are accepted via local signature validation.
