# PRD 0028: Account Suspension and Subscription Modules

## 1. Overview
As the application scales, there is a need to restrict user access on two fronts. First, a subscription model requires granular control over which modules (such as Reporting and Analysis) a user has access to. Second, a more aggressive "account suspension" mechanism is required to completely block all functions for a user in cases of malicious use, billing failure, or other severe violations.

## 2. Objectives
- Implement an aggressive "Account Suspension" flag that instantly blocks all API access and frontend synchronization for a specific user.
- Implement a "Module Subscription" system that links users to specific features (modules) they are allowed to use.
- Allow system administrators to manage both suspension status and module subscriptions via the Administration Console.

## 3. Scope
This feature touches the database layer, the backend API authentication and synchronization logic, the frontend application navigation, and the administration console interface.

### 3.1 Aggressive Account Suspension
- **Definition:** A boolean flag (`is_suspended`) attached to the user account.
- **Backend Enforcement:** When `is_suspended` is true, the user must be entirely blocked from utilizing any authenticated API endpoints. The system should return a `403 Forbidden` response for all standard user operations.
- **Frontend Behavior:** The frontend should detect the suspended state (either via a dedicated profile endpoint or by handling the `403` responses) and gracefully inform the user that their account is suspended, preventing further use of the application.

### 3.2 Subscription Modules
- **Definition:** A flexible many-to-many relationship mapping users to enabled modules.
- **Initial Module:** The first module to be controlled will be `reports_and_analysis`, which gates access to reporting exports and soil analysis functionalities.
- **Backend Enforcement:** The backend synchronization engine (`delta_sync`) must inspect the user's active modules. If a user lacks the `reports_and_analysis` module, the backend must not return any data belonging to that module (e.g., `soil_analyses`, `farm_records`) during the sync process.
- **Frontend Enforcement:** The frontend must use route guards to prevent navigation to module-specific pages (e.g., `/reporting` and its sub-routes, `/soil-analysis-results`). The navigation sidebar should dynamically hide links for disabled modules.

### 3.3 Administration Console
- **Admin Capabilities:** The `sw-admin-container` must be updated to display a user's suspension status and their enabled modules within the User List.
- **Management UI:** Admins must have the ability to toggle a user's `is_suspended` status and modify their list of enabled modules.

## 4. Security Considerations
- Suspension checks must happen early in the authentication middleware/extraction process to ensure no data is inadvertently leaked or manipulated by a suspended user.
- Module checks during the offline-first sync process are critical to prevent users from receiving data they have not subscribed to.

## 5. User Journeys and Testing
These functional user journeys must be explicitly built out and validated using Robot tests to ensure comprehensive functional coverage of these security rules.

### 5.1 Account Suspension Cycle Journey
- A user account is active and can access their data and API endpoints.
- An admin suspends the user's account (`is_suspended = true`).
- The user is immediately blocked from accessing any API endpoints (receives 403 Forbidden) and is locked out of the frontend application.
- An admin un-suspends the user's account (`is_suspended = false`).
- The user regains full access to their data and the frontend application.

### 5.2 Module Access Restriction Journey
- A user attempts to navigate to a module (e.g., Reporting) they are not currently subscribed to.
- The frontend route guard prevents navigation and redirects them.
- The backend synchronization engine completely filters out the restricted data (e.g., reports, soil analyses) from their sync payloads.

### 5.3 Module Subscription Granted Journey
- An admin updates a user's subscription to include a new module (e.g., `reports_and_analysis`).
- The user's frontend sidebar updates to display the newly granted module.
- The user is able to successfully navigate to the module and the backend successfully synchronizes the module's data.

### 5.4 Suspension Data Sync Block Journey
- A user is working offline and queueing up sync mutations.
- The user's account is suspended by an admin.
- The user comes back online and attempts to sync their queued data.
- The sync fails with a 403 Forbidden error and the backend rejects all mutations, preserving data security.
