# Specification 0014-14: Local Keycloak Dev Mode & Makefile Targets

**Status:** Complete
**PRD:** PRD 0014 (Development & Testing Tools), PRD 0001 (Core Architecture & Infrastructure)

## 1. Overview
This specification details the implementation for supporting two distinct local development modes:
1. **Shortcut / Standalone Dev Auth Mode:** Bypasses Keycloak, using an in-memory dev auth server (`debugging.enable_dev_auth = true`) and a dev persona picker (`/login`) for rapid local iteration.
2. **Local Keycloak Auth Mode:** Includes Keycloak directly in the local development login flow (`debugging.enable_dev_auth = false`), routing frontend authentication through Keycloak OIDC Authorization Code Flow with PKCE and validating tokens against Keycloak JWKS.

Additionally, this specification defines the Makefile targets and environment variable overrides for managing local keycloak endpoints.

## 2. Makefile Configuration & Targets

### 2.1 Default Keycloak Variables
The `Makefile` must define default variables for the Keycloak instance and realm, allowing developers to override them using environment variables:
```makefile
KEYCLOAK_URL ?= http://keycloak.k8s
KEYCLOAK_REALM_URL ?= $(KEYCLOAK_URL)/auth/realms/sw-dev
```

### 2.2 Dev Targets

#### Standalone Dev Mode Targets (Shortcut / Mock Auth)
- `sw-be-dev`: Runs the Axum backend in standalone mock auth mode (`debugging.enable_dev_auth = true`).
- `sw-fe-dev`: Runs the Angular frontend dev server configured for mock dev auth mode.

#### Local Keycloak Dev Mode Targets (Full OIDC Flow)
- `sw-be-dev-keycloak`: Runs the Axum backend configured for local Keycloak authentication. Overrides environment settings to set `debugging.enable_dev_auth = false` and configures the OIDC JWKS / issuer URL using `KEYCLOAK_REALM_URL`.
- `sw-fe-dev-keycloak`: Runs the Angular frontend dev server configured for local Keycloak OIDC authentication against `KEYCLOAK_REALM_URL`.

## 3. Backend Implementation Requirements

- When launched via `sw-be-dev-keycloak`:
  - `debugging.enable_dev_auth` must be set to `false`.
  - The backend auth middleware must fetch and cache JWKS from `${KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`.
  - Dev-only endpoints (`POST /dev/auth/token`, `GET /.well-known/jwks.json`) must remain unmounted.

## 4. Frontend Implementation Requirements

- When launched via `sw-fe-dev-keycloak`:
  - The runtime configuration (`assets/contents/app-config.json` or dynamic local dev config) must set `auth.provider` to `"keycloak"` and set `auth.issuerUrl` to `${KEYCLOAK_REALM_URL}`.
  - Navigating to `/login` must trigger standard OIDC PKCE redirect flow to `${KEYCLOAK_REALM_URL}/protocol/openid-connect/auth`.
