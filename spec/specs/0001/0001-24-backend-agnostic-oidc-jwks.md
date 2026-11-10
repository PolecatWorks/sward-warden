# 0001-24 Backend: Provider-Agnostic OIDC Verification via Standard JWKS and Dev Validation

**State**: Open

## 1. Overview
This specification supersedes [0001-21 Backend: Universal JWT Verification via JWKS](./0001-21-universal-jwt-jwks-verification.md). It eliminates provider-specific naming (e.g. `keycloak.expected_issuer`), removes all "magic" environment/address-based branching, and standardizes backend token verification on a single, uniform JWKS architecture.

In development mode (`enable_dev_auth: true`), the backend exposes its public keys at standard `/.well-known/jwks.json`. Application configuration requires explicit `auth.jwks_url`, `auth.issuer`, and `auth.audience` settings. A startup configuration validation step enforces that in development mode, `auth.jwks_url` matches the exposed local dev JWKS URL, ensuring dev/prod code path parity.

## 2. Motivation & Architectural Objectives
1. **Provider Independence**: Authentication configuration must not be coupled to Keycloak. Generalize configuration under an `auth` section (`jwks_url`, `issuer`, `audience`).
2. **Zero Verification Branching**: Eliminates distinct verification code paths between development and production. Every request is verified using public keys retrieved and cached via standard JWKS endpoints.
3. **No Magic Routing or Address-Triggered Modes**: Avoid hardcoded URL strings (such as `"http://localhost:8080"`) or mode switching based on request address or client hostnames.
4. **Configuration Validation on Startup**: Prevent silent misconfiguration by validating at startup that in dev mode, `auth.jwks_url` is configured and points to the backend's exposed dev JWKS URL.

## 3. Detailed Technical Requirements

### 3.1. Provider-Agnostic Configuration (`AppConfig`)
- In `sw-be-container/src/config.rs`:
  - Define `AuthConfig`:
    ```rust
    #[derive(Deserialize, Serialize, Debug, Clone)]
    pub struct AuthConfig {
        pub jwks_url: String,
        pub issuer: String,
        pub audience: String,
    }
    ```
  - In `AppConfig`, add `pub auth: AuthConfig`.
  - Deprecate/remove `keycloak.jwks_url`, `keycloak.expected_issuer`, and `keycloak.expected_audience`.
  - Maintain `keycloak.base_url`, `keycloak.realm`, `keycloak.client_id`, `keycloak.client_secret` solely for Keycloak Admin API user synchronization (per Spec 0001-20).

### 3.2. Configuration Validation (`AppConfig::validate`)
- Add a configuration validation method executed during application initialization:
  - Ensure `auth.jwks_url`, `auth.issuer`, and `auth.audience` are non-empty and well-formed.
  - If `debugging.enable_dev_auth` is `true`:
    - The backend exposes `/.well-known/jwks.json`.
    - Validate that `auth.jwks_url` points to `/.well-known/jwks.json` relative to the backend's configured service address (or matches the expected dev JWKS endpoint URL).
    - If `auth.jwks_url` does not point to the exposed dev JWKS URL, fail startup with a descriptive `AppError::ConfigurationError`.

### 3.3. Dev JWKS Endpoint & Signing Consistency
- In `sw-be-container/src/webserver/dev_auth.rs`:
  - When issuing a mock JWT (`generate_token`), sign the token with `state.config.auth.issuer` and `state.config.auth.audience`.
  - The endpoint `/.well-known/jwks.json` exposes the public RSA key components with the configured key ID (`dev-key-1`).

### 3.4. Single Verification Pipeline
- In `sw-be-container/src/webserver/auth.rs`:
  - `extract_jwt_claims()` performs uniform verification:
    - Decode token metadata to obtain `kid`.
    - Fetch the public key from `state.jwks_verifier` using `state.config.auth.jwks_url`.
    - Verify signature, expiration, `issuer` matching `state.config.auth.issuer`, and `audience` matching `state.config.auth.audience`.
    - Extract user ID / subject (`sub`) and role (`sward_roles` / `realm_access`).
  - No branching on `enable_dev_auth` during token verification.

### 3.5. Helm & GitOps Configuration Updates
- Update default configuration files (`default.yaml`, helm templates, and `fluxcd-dev` values):
  - In dev environment with Keycloak:
    ```yaml
    auth:
      jwks_url: "http://keycloak-keycloakx-http.auth.svc.cluster.local/auth/realms/sw-dev/protocol/openid-connect/certs"
      issuer: "https://sw-dev.polecatworks.com/auth/realms/sw-dev"
      audience: "sward-api"
    ```
  - In purely local standalone dev without Keycloak:
    ```yaml
    auth:
      jwks_url: "http://localhost:8080/.well-known/jwks.json"
      issuer: "http://localhost:8080"
      audience: "sward-api"
    ```

## 4. Acceptance Criteria
- [ ] Backend configuration features a provider-agnostic `auth` section (`jwks_url`, `issuer`, `audience`).
- [ ] Application validates configuration at startup, ensuring dev mode points `auth.jwks_url` to the dev JWKS endpoint.
- [ ] Dev mock token generation uses `auth.issuer` and `auth.audience` rather than hardcoded strings.
- [ ] Token verification logic is uniform and does not contain branches for development mode or specific IP addresses.
- [ ] In the live development environment (`sw-dev.polecatworks.com`), Keycloak access tokens are successfully verified via Keycloak's JWKS endpoint without triggering 401 Unauthorized errors.
- [ ] All backend unit and integration tests pass cleanly.
