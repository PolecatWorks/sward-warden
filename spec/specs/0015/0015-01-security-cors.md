# Security: Fix Overly Permissive CORS Policy

**State**: Complete

## 1. Overview
This specification details the resolution of an overly permissive CORS policy vulnerability in the backend API. The previous implementation used a wildcard `Any` for allowed origins, methods, and headers, which permitted any cross-origin requests. The fix introduces a strictly configured `CorsLayer` driven by the application's runtime configuration (`WebServiceConfig`).

## 2. Changes

- **`sw-be-container/src/config.rs`**: Introduced a new `CorsConfig` struct containing `allow_origins`, `allow_methods`, and `allow_headers` properties. Added this struct to the existing `WebServiceConfig`.
- **`sw-be-container/config/default.yaml`**: Updated default configuration to include the strict CORS settings.
- **`sw-be-container/src/webserver/mod.rs`**: Updated `start_app_api` to construct a `CorsLayer` utilizing the config values instead of using the `Any` wildcard.

## 3. Testing
- `sw-be-container/src/webserver/tests.rs`: Updated `get_test_state` with default CORS configurations to reflect the new structure. Added `test_cors_headers_present` to ensure preflight `OPTIONS` requests successfully return correct headers based on the state's configuration.
