# Google Authentication Integration Research

This document outlines options for integrating Google Authentication (Google OAuth 2.0 / OpenID Connect) into the Sward Warden platform, which consists of an Angular frontend (`sw-fe-container`) and a Rust backend (`sw-be-container`).

## Current State

The current architecture uses a custom JWT-based authentication system. The Rust backend validates JWTs using `jwt-simple` and RS256 keypairs. The Angular frontend intercepts requests and attaches the JWT as a Bearer token.

## Option 1: Integrating with Keycloak

**Keycloak** is an open-source identity and access management (IAM) solution. It can act as a broker between the application and external identity providers like Google.

### Does it make sense?

**Pros:**
1. **Centralized Identity Management**: Keycloak handles all the complexities of OAuth 2.0 / OIDC, password policies, 2FA, and session management.
2. **Easy Identity Brokering**: Adding Google (and later Microsoft, Facebook, Apple, etc.) is just a configuration step in the Keycloak admin console; no code changes required in the app.
3. **Standard OIDC**: The application (frontend and backend) only needs to know how to talk to Keycloak via standard OIDC, insulating the app from Google-specific quirks.
4. **Future-Proof**: Scales well for Enterprise features (SAML, Active Directory integration).

**Cons:**
1. **Infrastructure Overhead**: Running Keycloak requires deploying and maintaining an additional service (usually a Java/Quarkus app and its own Postgres database).
2. **Configuration Complexity**: Setting up Keycloak realms, clients, and role mapping can be complex initially.
3. **Overkill for Simple Needs**: If Google is the *only* provider needed and custom username/password login is not required, Keycloak might be too heavy.

**Conclusion on Keycloak:** It makes sense if the platform aims to be enterprise-grade with multiple identity providers, SSO across multiple apps, and complex role management. It is likely overkill if the goal is *just* adding a simple "Log in with Google" button.

---

## Option 2: Direct Google Authentication (Without Keycloak)

Yes, this is absolutely possible and often preferred for simpler architectures to avoid the infrastructure overhead of an IAM server.

### How it works (The Flow)

We would implement the **Google Sign-In for Web** using the standard OpenID Connect flow.

1.  **Frontend (Angular)**:
    *   Integrate the `@abacritt/angularx-social-login` library or the official Google Identity Services (`gsi`) JavaScript library.
    *   Render the "Sign in with Google" button.
    *   Upon successful user login on Google's modal/popup, Google returns an **ID Token** (a JWT) directly to the Angular frontend.
    *   The frontend sends this Google ID Token to the Rust backend (e.g., `POST /api/auth/google`).

2.  **Backend (Rust)**:
    *   The backend receives the Google ID Token.
    *   **Crucial Step:** The backend *must* verify the token's signature using Google's public keys (JWKS) and verify the `aud` (audience) matches the application's Google Client ID. (Libraries like `jsonwebtoken` or specific Google auth crates can handle this).
    *   Once verified, extract the user's email (`email` claim) and unique Google ID (`sub` claim).
    *   **Database Lookup/Creation**:
        *   Check if a user exists with this Google `sub` or email.
        *   If no, create a new user record in the `users` table.
        *   If yes, log them in.
    *   **Session Creation**:
        *   Generate a standard Sward Warden JWT (just like the current custom auth does) using the backend's private key.
        *   Return this custom JWT to the Angular frontend.

3.  **Subsequent Requests**:
    *   The Angular frontend stores the custom Sward Warden JWT and attaches it to all subsequent API requests.
    *   The backend validates its own custom JWT exactly as it does today.

### Pros of Direct Integration

1.  **No Extra Infrastructure**: No need to deploy, maintain, or update Keycloak.
2.  **Simpler Architecture**: Fewer moving parts. The backend remains the sole authority for application sessions.
3.  **Faster Implementation**: For a single provider like Google, writing the verification logic in Rust and adding the Google button in Angular is often faster than learning and configuring Keycloak.

### Cons of Direct Integration

1.  **Maintenance**: If we want to add Apple, Microsoft, or SAML later, we have to write custom integration code for each one.
2.  **Security Responsibility**: The backend is responsible for correctly validating external tokens, which carries a slight risk if implemented incorrectly.

## Recommendation

Given the current Rust/Angular architecture:

*   **Go with Direct Integration (Option 2)** if the immediate and only foreseeable requirement is "Login with Google". It keeps the infrastructure lean (just the app containers and Postgres) and leverages the existing custom JWT validation in the Rust backend for session management.
*   **Go with Keycloak (Option 1)** *only* if there is a concrete roadmap requirement for enterprise SSO (SAML), multiple different social logins, or complex user federation (Active Directory) in the near future.
