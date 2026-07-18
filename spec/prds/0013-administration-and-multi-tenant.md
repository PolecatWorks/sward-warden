# PRD 0013: Administration & Multi-Tenant Features

## Overview
This document defines the requirements for managing multiple users, data isolation, and platform administration. It consolidates previous requirements regarding the Administration Console (0013), Multi-User Data Isolation (0018), and Account Suspension/Modules (0028).

## 1. Multi-User Data Isolation
The application must guarantee strict data isolation between tenants (users).
- **Frontend Database Isolation:** The local RxDB database storage must be isolated on a per-user basis. The database name is dynamically constructed using the user's ID (e.g., `swarddb_1`).
- **User Switching (Dev Feature):** Switching users fetches a fresh JWT, clears the old token, and reloads the app.
- **Sync Checkpoint Validation:** The sync engine tracks the `lastSyncUserId`. If the current user differs from the last synced user, the sync metadata is invalidated and the page reloads to prevent cross-user data leakage.

## 2. Administration & Support Console
A dedicated interface is required for system administrators and support staff.
- **Separate Interface:** The Admin UI is a separately bundled and deployed application (e.g., `sw-admin-container`) to prevent administrative code from shipping to standard users.
- **Role Mappings (Keycloak Client Roles):**
  - **`admin`**: Full system administration and read/write access.
  - **`support`**: Access to read audit logs and view general farm data for diagnostic purposes (write access restricted, except where explicitly permitted).
  - **`user`**: Standard tenant access (read/write access to their own farms, fields, and compliance data).
  - **`viewer`**: Read-only access to view farms, fields, and records without modification permissions.
- **Role Claim Mapping:** Keycloak is configured with a protocol mapper (`sward-roles-mapper`) to map these client roles from the backend client (`sward-warden-be`) into the JWT access token's `sward_roles` claim array.
- **Admin Visibility:** A user with the `admin` role has visibility and management rights over all farms, fields, and events in the system.
  - The backend dynamically bypasses standard ownership filters for `admin` users on entity listing (`GET /farms`) and operations based on the roles claim.
- **Support Troubleshooting:** Support staff can view data specific to a user (Farms, Fields, Events, Records) to verify records or debug issues without direct database access.

## 3. Account Suspension & Keycloak Sync
An aggressive account suspension mechanism is required to block access for severe violations or billing failures.
- **Aggressive Suspension (`is_suspended` flag):** When true, the user is entirely blocked from utilizing any authenticated API endpoints (backend returns `403 Forbidden` directly from the JWT claims check).
- **Backend-to-Keycloak Synchronization:**
  - SwardWarden database acts as the system of record for account state.
  - When an admin toggles a user's suspension status via the Admin Console, the backend must save the change locally *and* programmatically call the Keycloak Admin API (`PUT /admin/realms/{realm}/users/{id}`) to:
    1. Set the Keycloak user account to disabled (`enabled: false`), which prevents any active Refresh Tokens from obtaining new Access Tokens.
    2. Update the custom user attribute `is_suspended: true` to be encoded in the JWT when issued.
- **Frontend Handling:** The frontend detects the suspended state from the JWT claims or when silent OIDC refresh fails, and gracefully informs the user, preventing further application use.
- **Admin Control:** Administrators can toggle the `is_suspended` status via the Administration Console.

## 4. Subscription Modules & Keycloak Sync
A flexible system to gate access to specific features (modules).
- **Module Mapping:** A relationship mapping users to enabled modules, recorded in the SwardWarden database.
- **Initial Module:** `reports_and_analysis` (gates access to reporting exports and soil analysis).
- **Backend-to-Keycloak Synchronization:**
  - When an admin modifies a user's enabled subscription modules via the Admin Console, the backend updates the local database *and* calls the Keycloak Admin API (`PUT /admin/realms/{realm}/users/{id}`) to update the custom user attribute `modules` with the active modules list (e.g. `modules: ["reports_and_analysis"]`).
- **Backend Enforcement:** The delta sync engine inspects active modules from the JWT's `sward_modules` claim and omits data belonging to disabled modules (e.g., skips syncing `soil_analyses` if the module is inactive).
- **Frontend Enforcement:** Route guards inspect the JWT claims to prevent navigation to module-specific pages, and the sidebar dynamically disables and greys-out related links.
- **Admin Control:** Administrators manage a user's enabled modules via the Administration Console.

## 5. Production User Provisioning
To manage user access at scale, three OIDC registration and provisioning flows are supported:
- **Keycloak Self-Registration (Default):** Enabled in Keycloak Realm settings. Self-registered users are automatically assigned to a default group (e.g., granting the `user` and `viewer` client roles) upon verification.
- **Programmatic Provisioning (Admin API):** The backend API can use a Keycloak service account credentials to provision custom users or system-to-system integration accounts via Keycloak's user endpoints.
- **Just-In-Time (JIT) Identity Federation:** If users log in via third-party Identity Providers (Google, GitHub, etc.), Keycloak brokers the login and provisions local profiles on first login, mapping external claims to SwardWarden roles.

## 6. User Journeys
The following user journeys validate tenant security and restriction capabilities:

- **Account Suspension Cycle Journey (`test_account_suspension.robot`)**: The integration testing suite must include an account suspension verification journey. The journey must use the API to create a test user, confirm they can fetch their profile, and then suspend them using an admin request. It must verify that any further profile requests from the user are blocked with a `403 Forbidden` response. It must then unsuspend the user using an admin request, verify their API access is restored (returns `200 OK`), and verify that when suspended, the user is blocked from making push requests to the sync endpoint.
- **Module Access Restriction and Granting Journey (`test_module_subscriptions.robot`)**: The integration testing suite must include a subscription module access verification journey. The journey must create a user without the 'reports_and_analysis' module subscription. It must log in to the UI and verify that the "Reporting" navigation sidebar link is disabled, and manual navigation attempts to `/reporting` are redirected back `/home` by route guards. It must also verify that a backend sync payload for this user contains empty reporting data arrays. Finally, it must grant the user the module via an admin API request, log in to the UI, verify the sidebar link becomes active, and confirm clicking it successfully navigates to the `/reporting` page.
