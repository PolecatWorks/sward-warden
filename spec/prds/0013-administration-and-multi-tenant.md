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
- **Admin Visibility:** A user with the `admin` role has visibility and management rights over all farms, fields, and events in the system.
  - The backend dynamically bypasses standard ownership filters for `admin` users on entity listing (`GET /farms`) and operations.
- **Support Troubleshooting:** Support staff can view data specific to a user (Farms, Fields, Events, Records) to verify records or debug issues without direct database access.

## 3. Account Suspension
An aggressive account suspension mechanism is required to block access for severe violations or billing failures.
- **Aggressive Suspension (`is_suspended` flag):** When true, the user is entirely blocked from utilizing any authenticated API endpoints (backend returns `403 Forbidden`).
- **Frontend Handling:** The frontend detects the suspended state and gracefully informs the user, preventing further application use.
- **Admin Control:** Administrators can toggle the `is_suspended` status via the Administration Console.

## 4. Subscription Modules
A flexible system to gate access to specific features (modules).
- **Module Mapping:** A many-to-many relationship mapping users to enabled modules.
- **Initial Module:** `reports_and_analysis` (gates access to reporting exports and soil analysis).
- **Backend Enforcement:** The delta sync engine inspects active modules and omits data belonging to disabled modules (e.g., skips syncing `soil_analyses` if the module is inactive).
- **Frontend Enforcement:** Route guards prevent navigation to module-specific pages, and the sidebar dynamically hides related links.
- **Admin Control:** Administrators manage a user's enabled modules via the Administration Console.
