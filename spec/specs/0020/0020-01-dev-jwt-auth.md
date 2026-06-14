# Technical Specification: Dev JWT Authentication

**State**: Open

## 1. Overview
This specification details the transition from plain HTTP headers (`X-User-ID`, `X-User-Role`) used in local development to a secure, mockable JSON Web Token (JWT) flow. The backend will generate RSA keypairs, sign tokens, and publish a JWKS endpoint for service mesh validation, while the frontend will be updated to fetch, store, and attach these tokens to outgoing requests.

## 2. Proposed Changes

### Backend (`sw-be-container`)

- **Dependencies (`Cargo.toml`)**:
  - Add the `jwt-simple` crate for RSA key generation, token signing, and verification.

- **Configuration (`config/default.yaml` and config models)**:
  - Add `debugging.enable_dev_auth` (boolean) to the configuration structure.
  - Ensure dev endpoints are only active/mounted when `enable_dev_auth` is explicitly `true`.

- **Key Generation & State**:
  - Implement an initialization hook that generates a temporary, in-memory RS256 keypair on startup if `enable_dev_auth` is enabled.
  - Store the keypair in the backend application state (`AppState`) for signing/verification operations.

- **Endpoints**:
  - **`POST /dev/auth/token`**:
    - Payload: `{ "user_id": i64, "roles": Vec<String> }`
    - Action: Signs and returns a JWT using the in-memory private key.
    - JWT structure:
      - Header: `alg: RS256`, `kid: dev-key-1`
      - Claims: `sub` (User ID stringified), `iss` (`http://localhost:8080`), `aud` (`sward-api`), `exp` (expiration), `iat` (issued at), and a custom `sward_roles` claim (array of roles).
  - **`GET /.well-known/jwks.json`**:
    - Action: Expose the public key in standard JWKS (JSON Web Key Set) format.

- **Middleware / Request Extractors (`src/webserver/auth.rs`)**:
  - Update `UserId`, `AdminOnly`, and `SupportOnly` extractors to parse the `Authorization: Bearer <token>` header.
  - Validate the token using the public key from the in-memory keypair.
  - Extract the User ID and roles from the token claims to populate the request context.

### Frontend (`sw-fe-container`)

- **Dev Login Flow**:
  - Update/implement the mock user selection page/dropdown to perform a POST request to `/dev/auth/token` on selection.
  - Store the returned token in `localStorage`.

- **Interceptor (`src/app/services/dev-auth.interceptor.ts`)**:
  - Update the interceptor to attach the stored token under the `Authorization: Bearer <token>` header for all API calls.
  - Handle token expiration or validation failure (401 Unauthorized) by clearing the local storage token and redirecting to the login/user-switch page.

## 3. Testing & Verification

- **Unit Tests**:
  - Add tests in `sw-be-container` verifying key generation, JWKS generation, JWT signing, and token validation.
  - Test middleware reject behavior with missing, invalid, or expired tokens.
  - Test frontend interceptor with unit tests to ensure `Authorization` header is added properly.
- **Integration Tests**:
  - Run `make robot-test` to ensure existing API behavior remains compatible.
