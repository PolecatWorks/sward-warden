# Product Requirements Document: Security CORS Policy Hardening

## Status
Complete

## 1. Introduction
The objective of this project is to address a security vulnerability identified in the backend API regarding an overly permissive Cross-Origin Resource Sharing (CORS) policy. Hardening the CORS policy prevents unauthorized cross-origin requests, protecting the application's resources and users from Cross-Site Request Forgery (CSRF) and data leakage.

## 2. Goals & Objectives
*   Harden the backend API by replacing the wildcard CORS policy with a strict, whitelist-based policy.
*   Allow dynamic, environment-specific configurations for allowed origins, methods, and headers.
*   Maintain seamless compatibility with local development workflows while securing staging and production environments.
*   Ensure the CORS policy can be verified via automated integration tests.

## 3. Scope
**In Scope:**
*   Adding CORS configuration options to the backend application runtime configuration (`WebServiceConfig`).
*   Restricting allowed origins, headers, and methods based on this runtime configuration.
*   Using strict CORS middleware (`CorsLayer`) in the web server initialization flow.
*   Writing automated unit/integration tests to verify CORS behavior.

**Out of Scope:**
*   Implementing client-side CORS handling or handling CORS on third-party integrations.
*   Adding IP-based whitelist restriction at the network layer.

## 4. Requirements

### 4.1. Functional Requirements
*   **REQ-1 (Configurable Whitelist)**: The application must support defining allowed origins, allowed methods, and allowed headers through the runtime configuration file (`default.yaml` and environment variables).
*   **REQ-2 (CORS Enforcement)**: The backend API web server must reject cross-origin requests from origins not explicitly permitted by the runtime configuration.
*   **REQ-3 (Preflight Request Handling)**: The server must handle preflight `OPTIONS` requests and respond with the appropriate CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) based on the active configuration.

### 4.2. Non-Functional Requirements
*   **NFR-1 (Security)**: The system must default to a secure configuration and must not expose wildcard settings (like `*` or `Any`) in production configuration environments.
*   **NFR-2 (Testability)**: The configuration and server startup logic must be testable using test configurations to verify CORS header injection.

## 5. Technical Considerations
*   The Rust web server uses Axum/Tower-HTTP, which includes `CorsLayer` middleware for easy configuration of CORS behaviors.
*   Configuration parameters should be added to the existing `WebServiceConfig` struct in `sw-be-container/src/config.rs` and mapped from config files.
