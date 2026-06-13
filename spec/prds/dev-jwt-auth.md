# Product Requirements Document: Dev JWT Authentication

## Objective
To bring the local development experience closer to the production environment by replacing simple HTTP dev headers (`X-User-ID` and `X-User-Role`) with a fully functional JSON Web Token (JWT) authentication flow. This will be achieved without requiring developers to spin up a full external authentication system (e.g., Keycloak), reducing friction while maintaining architectural parity.

## Scope
This PRD outlines the changes required across the backend container (`sw-be-container`) and the frontend container (`sw-fe-container`), as well as how local deployment configurations (such as Istio) will interact with this new setup.

## Current State
- The backend relies on plain HTTP headers (`X-User-ID` and `X-User-Role`) for authentication and authorization.
- The frontend injects these headers directly into API calls during development.

## Proposed State
- The backend will internally generate RSA keypairs to sign JWTs and expose a JSON Web Key Set (JWKS) endpoint.
- Developers will be able to retrieve signed JWTs via a dev-only backend endpoint.
- The backend middleware will be updated to validate JWTs instead of plain dev headers.
- The frontend will include a basic "Dev Login" interface where users can select a user persona, retrieve a JWT, and pass it as an `Authorization: Bearer <token>` header in all subsequent requests.
- The Istio service mesh in local Kubernetes deployments will be able to perform authentication checks using the exposed JWKS endpoint.

## Backend Requirements (`sw-be-container`)

### Production Security Constraint
- **Critical Requirement:** The endpoints described below (`/dev/auth/token` and `/.well-known/jwks.json`) and the associated key-generation logic MUST be explicitly disabled when the application is running in production mode. Production environments must exclusively rely on the external Identity Provider (e.g., Keycloak) for JWT issuance and validation.

### Key Generation and Management
- The backend will utilize the [`jwt_simple`](https://crates.io/crates/jwt-simple) Rust crate for key generation, JWT signing, and verification.
- On backend startup (when running in local/dev mode), an RSA keypair (RS256) will be generated in-memory.
- This keypair will be retained in application state for the lifecycle of the process to sign new tokens and validate incoming requests.

### Endpoints
1. **Token Generation (`POST /dev/auth/token`)**
   - **Scope:** Dev environments only.
   - **Payload:** Accepts a User ID and desired Roles.
   - **Action:** Signs and returns a JWT using the in-memory RSA private key.
   - **JWT Structure:**
     - **Header:** `alg: RS256`, `kid: dev-key-1`
     - **Standard Claims:**
       - `sub`: The User ID.
       - `iss`: `http://localhost:8080` (or the backend's base URL / internal Kubernetes service name).
       - `aud`: `sward-api` (suggested default, to be adjusted as needed during implementation).
       - `exp`: Standard expiration (e.g., 24 hours).
       - `iat`: Issued at time.
     - **Custom Claims:**
       - `sward_roles` (or similar custom claim): The roles associated with the user (e.g., `user`, `admin`), structured to simulate future Keycloak/OIDC output.

2. **JWKS Output (`GET /.well-known/jwks.json`)**
   - **Scope:** Dev/Local environments.
   - **Action:** Returns the public key component of the in-memory RSA keypair in standard JWKS format.
   - **Purpose:** Allows Istio or other internal services to fetch the keys and perform their own JWT validation checks prior to routing to the backend.

### Middleware Migration
- Replace existing header-based extraction (`X-User-ID`, `X-User-Role`) with JWT validation.
- The middleware must parse the `Authorization: Bearer <token>` header, verify the token's signature using the in-memory public key (or fetch from JWKS), and extract the `sub` and custom role claims into the request context.

## Frontend Requirements (`sw-fe-container`)

### Dev Login Flow
- Implement a basic "Dev Login" UI or dropdown to select a mock user (e.g., User A, Admin User B).
- When a user is selected, the frontend calls the backend `POST /dev/auth/token` endpoint to acquire the JWT.
- Store the returned JWT locally (e.g., in `localStorage` or session state).

### Interceptor Update
- Update the HTTP interceptor to inject the JWT as an `Authorization: Bearer <token>` header on all outgoing API requests instead of using `X-User-ID` and `X-User-Role` headers.
- Handle token expiration by clearing the token and redirecting the user back to the Dev Login UI if a 401 Unauthorized response is received.

## Open Questions / Future Adjustments
- **Issuer / Audience specific values:** Suggested values (`iss: http://localhost:8080`, `aud: sward-api`) can be adjusted during the PR implementation if they do not perfectly align with Istio testing requirements.
- **Key Persistence:** Currently designed to generate keys in-memory on every backend startup. If frontend tokens expiring on every backend restart becomes a friction point, this can be updated to persist the keypair to a local file (`.dev-keys/rsa.pem`).
