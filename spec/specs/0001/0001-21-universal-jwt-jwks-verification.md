# 0001-21 Backend: Universal JWT Verification via JWKS

**State**: Open

## 1. Overview
This specification details the transition of the SwardWarden Rust backend (`sw-be-container`) from trusting mesh-injected headers (`x-jwt-payload`) or using unauthenticated fallback mechanisms to a universal, zero-trust token verification model.

Under this model, the backend cryptographically validates the signature, issuer, audience, and expiration of incoming `Authorization: Bearer <token>` requests using standard JSON Web Key Sets (JWKS) retrieved from an OIDC provider (Keycloak in production/cluster, or a local/mock JWKS provider in development).

This specification supersedes [0001-18 Backend: Auth Middleware & Istio Integration](./0001-18-backend-auth-middleware-istio.md).

## 2. Motivation & Architectural Objectives
1. **Zero-Trust Network Architecture**: Eliminate reliance on implicit network perimeter security or untrusted HTTP headers (`x-jwt-payload`, `x-user-id`, `x-user-role`). Incoming requests must carry cryptographic proof of identity regardless of source (ingress gateway, internal mesh, or direct port access).
2. **Elimination of Production Bypass Backdoors**: Ensure the production release binary contains no bypass branches, fake claim parsing, or unverified token decoding.
3. **Parity Between Dev and Prod**: Use the exact same signature-verification code path across production, CI, and local development environments.

## 3. Detailed Requirements

### 3.1. Deprecation & Header Sanitation
- **Remove `x-jwt-payload`**: The backend shall no longer parse or trust `x-jwt-payload` headers.
- **Remove Dev Header Fallbacks**: Remove all handling of `x-user-id` and `x-user-role`.
- **Strict Bearer Token Enforcement**: All authenticated endpoints require an `Authorization: Bearer <token>` header formatted according to RFC 6750. Requests lacking a valid Bearer token shall be rejected with `401 Unauthorized`.

### 3.2. JWKS Resolution & Signature Verification
- **Configuration**:
  - The backend configuration (`keycloak` or `auth` section in `AppConfig`) shall specify:
    - `jwks_url`: Target URL to fetch JSON Web Key Sets (e.g., `http://keycloak.../realms/{realm}/protocol/openid-connect/certs`, or `http://localhost:8080/.well-known/jwks.json` in dev mode).
    - `expected_issuer`: Expected OIDC token issuer URL claim (`iss`).
    - `expected_audience`: Expected audience claim (`aud`, e.g., `sward-api` or `sward-warden-be`).
- **Key Fetching & Caching**:
  - The backend shall fetch and cache public signing keys (RSA / EdDSA) from the `jwks_url`.
  - Cache policy: Keys must be cached in memory with a configurable time-to-live (TTL, default: 1 hour).
  - Key rotation support: If an incoming token specifies a `kid` (Key ID) not currently in the cache, the backend shall attempt a cache refresh before failing token verification.
- **Verification Rules**:
  - Verify signature against the matching public key identified by `kid`.
  - Verify standard claims: `nbf` (not before), `exp` (expiration), `iss` (issuer matches `expected_issuer`), and `aud` (audience matches `expected_audience`).
  - Extract `sub` (User ID / Keycloak Subject ID) and `sward_roles` from the verified claims payload.

### 3.3. Development & CI Patterns
- **No Production Backdoors**:
  - The release binary must not contain backdoors that accept unverified tokens.
- **Mock/Local Keycloak Support**:
  - In local development or lightweight testing when external Keycloak is not running, the application or test harness can point `jwks_url` to a local JWKS endpoint (such as the existing dev mock JWKS endpoint or a lightweight mock OIDC service).
  - The verification logic itself remains active and identical: the token is signed with a private key and verified by the backend against the corresponding public JWKS.

## 4. Acceptance Criteria
- [ ] Backend extracts only `Authorization: Bearer <token>` and rejects requests without it with `401 Unauthorized`.
- [ ] Backend completely ignores `x-jwt-payload`, `x-user-id`, and `x-user-role`.
- [ ] Backend verifies JWT signatures against the configured JWKS endpoint.
- [ ] Public keys are cached and refreshed if an unknown `kid` is encountered.
- [ ] Invalid signatures, expired tokens, or mismatched issuer/audience return `401 Unauthorized`.
- [ ] Local dev mode and unit/integration tests verify tokens using the exact same JWKS verification pipeline.
- [ ] Specification 0001-18 is marked as `Superceded`.
