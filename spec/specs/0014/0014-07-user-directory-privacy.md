# Specification 0014-07: User Directory Privacy & API Restrictions

**State**: Complete

## 1. Overview
This specification details the restriction of the user directory endpoint (`GET /users`) to local development and testing environments to prevent unauthorized data exposure in production.

## 2. Requirements

- **User Directory Privacy**: The backend endpoint `GET /users` (which lists all users) must be blocked in production/non-development environments, returning a `403 Forbidden` response.
- **Environment Detection**: The environment mode must be configurable via an environment flag or config file field (e.g. `debugging.environment`), defaulting to `"production"` unless explicitly configured as `"development"` or `"testing"`.

## 3. Changes

- **`sw-be-container/src/config.rs`**: Added `environment: Option<String>` to `DebuggingConfig`.
- **`sw-be-container/config/default.yaml`**: Configured `environment: "development"` for local debugging.
- **`sw-be-container/src/webserver/users.rs`**: Added an environment check inside `list_users` to return `AppError::Forbidden` if the environment is not `"development"` or `"testing"`.
