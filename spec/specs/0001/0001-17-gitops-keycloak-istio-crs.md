# Infrastructure: Keycloak CRs and Istio Security Policies

**State**: Planned

## 1. Overview
This specification details the infrastructure updates required in the `fluxcd-dev` environment to secure the SwardWarden application using Keycloak and Istio. It defines the necessary Keycloak Custom Resources (CRs) using the EDP Keycloak Operator, and the Istio `RequestAuthentication` and `AuthorizationPolicy` CRs.

These changes shift the authentication boundary to the Istio service mesh, which will validate JWTs issued by Keycloak and forward the decoded claims to the backend.

## 2. Prerequisites
- The environment must have the EDP Keycloak Operator and Istio already installed and running.
- The `fluxcd-dev` repository structure is used for deploying these manifests.

## 3. Implementation Details

### 3.1. Keycloak Custom Resources
Define the Keycloak Realm, Clients, and configuration required to support SwardWarden. These manifests should be added to the `fluxcd-dev` directory (e.g., `fluxcd-dev/keycloak-crs.yaml`).

- **KeycloakRealm**:
  - Name: `sw-dev`
  - Enable User Registration.
  - Set up a default group (e.g., `sw-users`) that automatically applies the `user` role to new signups.

- **KeycloakClient (Frontend)**:
  - Name: `sward-warden-fe`
  - Client ID: `sward-warden-fe`
  - Public client (no client secret).
  - Valid Redirect URIs: `http://localhost:4200/*`, `https://sward.k8s/*` (and any other dev ingress patterns).
  - Web Origins (CORS): `+` (to allow Redirect URIs).
  - Protocol Mapper: Map user client roles into a claim array named `sward_roles`.

- **KeycloakClient (Backend)**:
  - Name: `sward-warden-be`
  - Client ID: `sward-warden-be`
  - Bearer-only / Service account enabled (for Admin API access, covered in a separate spec).

### 3.2. Istio Security Policies
Define the Istio policies to enforce authentication on the backend API. These should be added to `fluxcd-dev/sward-warden-be.yaml` or a new file like `fluxcd-dev/security.yaml`.

- **RequestAuthentication**:
  - Target: The `sward-warden-be` workload.
  - Issuer: The full URL to the Keycloak `sw-dev` realm issuer.
  - JWKS URI: The URL to the Keycloak `sw-dev` realm's certs endpoint.
  - `forwardOriginalToken`: Set to `true` to ensure the `Authorization: Bearer <token>` header is passed to the backend pod.
  - `outputPayloadToHeader`: Set to `x-jwt-payload` (or similar). This instructs Istio to base64-encode the verified JWT payload and inject it as an HTTP header. This is critical for the backend to read the `sub` and `sward_roles` without verifying the signature itself.

- **AuthorizationPolicy**:
  - Target: The `sward-warden-be` workload.
  - Action: `ALLOW` (or `DENY` default).
  - Rules: Require a valid request principal (JWT validation passed) for all paths under `/sward/v0`, except for health checks (`/hams/alive`, `/hams/ready`) or specific development endpoints if they exist in the container.
  - Reject requests without a valid token.

## 4. Acceptance Criteria
- [ ] Keycloak CRs correctly provision the `sw-dev` realm and the FE/BE clients via the EDP operator.
- [ ] Istio `RequestAuthentication` is applied and successfully fetches the Keycloak JWKS.
- [ ] Istio `AuthorizationPolicy` denies unauthenticated traffic to the backend API.
- [ ] Authenticated requests passing through Istio have the `x-jwt-payload` header injected containing the decoded JWT claims.
- [ ] Authenticated requests passing through Istio retain the original `Authorization: Bearer <token>` header.
