# Backend: Keycloak Admin API Synchronization

**State**: Planned

## 1. Overview
This specification details the requirements for the Rust backend (`sw-be-container`) to communicate with the Keycloak Admin API to synchronize user state changes, specifically account suspensions and module subscription updates. This ensures that administrative actions taken within SwardWarden are accurately reflected in Keycloak and subsequently in the JWT claims issued to the user.

## 2. Prerequisites
- The backend must be configured with a Keycloak service account client (e.g., `sward-warden-be`) that has the necessary roles (`manage-users`) to invoke the Keycloak Admin API.
- The original `Authorization: Bearer <token>` must be available in the request context (as implemented in Spec 0001-18) or the backend must be capable of obtaining a service account token to authorize its requests to the Admin API.

## 3. Implementation Details

### 3.1. Account Suspension Synchronization
When an administrator modifies a user's `is_suspended` status in the SwardWarden database (e.g., via the Admin Console):
- The backend must persist the change locally.
- The backend must make a programmatic `PUT` request to the Keycloak Admin API: `/admin/realms/{realm}/users/{user_id}`.
- If the user is being suspended (`is_suspended: true`), the request payload must set `enabled: false` to disable the Keycloak account and invalidate any active sessions or refresh tokens. It must also update the custom user attribute `is_suspended: true`.
- If the user is being unsuspended (`is_suspended: false`), the request payload must set `enabled: true` and update the custom user attribute `is_suspended: false`.

### 3.2. Module Subscription Synchronization
When an administrator modifies a user's active module subscriptions in the SwardWarden database:
- The backend must persist the changes locally.
- The backend must make a programmatic `PUT` request to the Keycloak Admin API: `/admin/realms/{realm}/users/{user_id}`.
- The request payload must update the custom user attribute `modules` with the updated list of active modules (e.g., `modules: ["reports_and_analysis"]`). This ensures the updated list is included in the `sward_modules` claim of newly issued JWTs.

### 3.3. Error Handling and Resiliency
- The backend must handle potential network failures or errors when communicating with the Keycloak Admin API.
- If the Keycloak API call fails, the backend should either rollback the local database change or implement a retry/queue mechanism to ensure eventual consistency between SwardWarden and Keycloak. The specific error handling strategy should be clearly logged.

## 4. Acceptance Criteria
- [ ] Suspending a user via the backend API updates the local database and successfully sets `enabled: false` and `is_suspended: true` in Keycloak via the Admin API.
- [ ] Unsuspending a user via the backend API updates the local database and successfully sets `enabled: true` and `is_suspended: false` in Keycloak via the Admin API.
- [ ] Updating a user's module subscriptions via the backend API updates the local database and successfully updates the `modules` custom attribute in Keycloak via the Admin API.
- [ ] The backend handles Keycloak Admin API errors gracefully, preventing inconsistent state between the local database and Keycloak.
