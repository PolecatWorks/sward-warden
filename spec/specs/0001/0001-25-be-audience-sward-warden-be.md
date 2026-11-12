# Backend OIDC Audience Alignment (`sward-warden-be`)

**State**: Open

## 1. Overview
In PRD 0001 / PRD 0014 and specification 0001-21 / 0001-24, backend OIDC JWT verification validates the token audience (`aud`).
Keycloak client authentication issues access tokens targeted at the backend API client (`sward-warden-be`), with claims containing `"aud": ["sward-warden-be", "account"]`.

However, the default and deployed backend configuration specified `audience: "sward-api"`. Consequently, whenever the frontend passes a valid Keycloak access token to the backend, the backend verification fails with:
`Invalid token signature or claims: Required audience mismatch`.

This triggers a 401 Unauthorized status on the frontend, which invokes `devAuthInterceptor` and bounces the user back to `/login`.

This specification aligns the expected backend audience to accept `sward-warden-be` (or allows `sward-warden-be` alongside `sward-api` for backward compatibility).

## 2. Requirements

1. **Backend Default Configuration**:
   - `sw-be-container/config/default.yaml` must set `auth.audience` to `"sward-warden-be"`.
   - `charts/sward-warden/configs/config.yaml` must set `auth.audience` to `"sward-warden-be"`.
   - `fluxcd-dev/sward-warden-be.yaml` must set `audience: "sward-warden-be"`.
   - `garden.yml` backend auth audience (if present) must align with `"sward-warden-be"`.

2. **Backend JWT Verification**:
   - In `sw-be-container/src/webserver/auth.rs`, the fallback default audience when unset must default to `"sward-warden-be"`.
   - Support accepting either `"sward-warden-be"` or the configured audience in `VerificationOptions::allowed_audiences` so existing environments and dev auth tokens remain fully compatible.

3. **Backend Dev Auth Token Issuer**:
   - Dev auth token creation in `sw-be-container/src/webserver/dev_auth.rs` must issue tokens with the configured `state.config.auth.audience` (defaulting to `"sward-warden-be"`).

4. **Unit and Integration Verification**:
   - All backend unit tests in `sw-be-container` must pass.
   - Calling backend endpoints with Keycloak-issued tokens containing `"aud": "sward-warden-be"` must succeed.
