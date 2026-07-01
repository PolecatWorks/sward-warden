# Specification 0014-09: Dev JWT Authentication (Backend)

## 1. Overview
This specification details the backend implementation for Dev JWT Authentication. The goal is to replace simple HTTP dev headers (`X-User-ID`, `X-User-Role`) with functional JWTs during local development to mirror production Istio authentication. This must be strictly isolated from production environments.

## 2. Configuration & Security Constraints

- **Explicit Opt-In:** The Dev JWT features must be explicitly enabled via a configuration flag to prevent accidental exposure in production.
- **Config Key:** Add `debugging.enable_dev_auth` to the `figment` configuration setup (defaulting to `false` in `default.yaml`).
- **Endpoint Registration:** The endpoints (`POST /dev/auth/token` and `GET /.well-known/jwks.json`) must *only* be mounted if `debugging.enable_dev_auth == true`. Checking `run_mode` alone is not sufficient.

## 3. Key Generation & Management

- **Library:** Use the `jwt_simple` crate.
- **Startup:** If `enable_dev_auth` is true, the backend application state must initialize and generate an in-memory RSA keypair (RS256) on startup.
- **Persistence:** Keys are maintained in memory for the lifecycle of the process. If restarted, a new keypair is generated (all active dev tokens will invalidate).

## 4. Endpoints

### 4.1 Token Generation (`POST /dev/auth/token`)
- **Request Body:** Requires a `user_id` (String) and an array of `roles` (Vec<String>).
- **Processing:**
  - Extracts the in-memory RSA private key.
  - Constructs a JWT payload with:
    - `alg: RS256`, `kid: dev-key-1` (Header)
    - `sub`: the requested `user_id`.
    - `iss`: `http://localhost:8080` (or derived from config).
    - `aud`: `sward-api`
    - `exp`: 24 hours from issue time.
    - `sward_roles`: the requested `roles` array.
  - Signs the payload.
- **Response:** Returns the signed JWT string.

### 4.2 JWKS Output (`GET /.well-known/jwks.json`)
- **Processing:** Formats the public key component of the in-memory RSA keypair into a standard JSON Web Key Set (JWKS) format.
- **Response:** Returns the JWKS JSON object. This is used by Istio (or frontend testing) to validate the issued tokens locally.

## 5. Middleware Migration

- **Current State:** The authentication middleware extracts `X-User-ID` and `X-User-Role` from HTTP headers.
- **Target State:** The middleware must be updated to expect the `Authorization: Bearer <token>` header.
- **Validation:**
  - Parse the Bearer token.
  - In development mode (if `enable_dev_auth` is true), the middleware can either use the in-memory public key to verify the token signature, or rely on Istio performing the validation upstream and forwarding validated headers (depending on the exact local cluster topology). To strictly mirror production where Istio does the validation, the backend might still rely on validated claims passed in trusted headers *from Istio*, but for direct backend testing, the middleware should have the capability to parse the JWT directly.
  - Extract the `sub` and `sward_roles` claims to populate the request context.
