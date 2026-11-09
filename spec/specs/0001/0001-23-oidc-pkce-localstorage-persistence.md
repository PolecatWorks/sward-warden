# Specification: 0001-23 Frontend OIDC PKCE & OAuthStorage LocalStorage Persistence

## Status
Complete

## PRD Reference
- `spec/prds/0001-core-architecture.md` (Authentication, Security, Offline Resilience)

## Context
When authenticating against Keycloak using OpenID Connect Authorization Code Flow with PKCE in the frontend (`sw-fe-container`), the user is redirected away to Keycloak (`/auth/realms/...`) and redirected back to the root application (`/?state=...&code=...`).

In modern web browsers and PWA environments:
1. `sessionStorage` can be reset or lost across full-page redirect chains, causing `angular-oauth2-oidc` to lose its PKCE code verifier and cryptographic nonce.
2. `provideOAuthClient()` registers a default `OAuthStorage` provider resolving to `sessionStorage`. Because `{ provide: OAuthStorage, useValue: localStorage }` was declared prior to `provideOAuthClient()`, `provideOAuthClient()` overrode `OAuthStorage` back to `sessionStorage`.
3. In `angular-oauth2-oidc`, `saveNoncesInLocalStorage` defaults to `false`. Without enabling `saveNoncesInLocalStorage: true` and ensuring `OAuthStorage` resolves to `localStorage`, the token exchange fails (`invalid_nonce_in_state` or `No PKCE verifier found in oauth storage!`), bouncing the user back to `/login`.

## Requirements
1. **OAuthStorage Provider Ordering**:
   - `OAuthStorage` provider MUST be provided *after* `provideOAuthClient()` in `ApplicationConfig.providers` (or using `useFactory: () => localStorage`) so that `localStorage` is reliably used for all token, claim, and OIDC state persistence.
2. **Persistent Nonce and PKCE Verifier Storage**:
   - The OIDC `AuthConfig` MUST explicitly configure `saveNoncesInLocalStorage: true` (or set `oauthService.saveNoncesInLocalStorage = true`) so that PKCE verifiers and nonces survive redirects across browser sessions, reloads, and PWA restarts.
3. **Seamless Redirect and Session Restoration**:
   - Upon redirect back from the Keycloak authorization endpoint with `code=` and `state=`, `tryLoginCodeFlow()` must find the saved PKCE verifier and nonce in `localStorage`, successfully exchange the authorization code for access and ID tokens, and update `AuthService.authState$`.
