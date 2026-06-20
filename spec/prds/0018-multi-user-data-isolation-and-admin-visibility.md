# PRD 0018: Multi-User Data Isolation and Admin Visibility

## Overview
This document defines the requirements for ensuring data isolation between different users in the local-first frontend database, and enabling administrative users to view and manage all farms, fields, and events in the system regardless of ownership.

## Key Features

1. **Frontend Database Isolation per User**
   - **Requirement**: The application must isolate local RxDB database storage on a per-user basis.
   - **Details**: The RxDB database name must be dynamically constructed using the currently logged-in user's ID (e.g., `swarddb_1`, `swarddb_999`).
   - **Behaviour**: When switching users via the dev user switcher, the app will reload and open the database corresponding to the new user. If the new user has not synced before, their local database will start empty and pull their specific data from the backend. When switching back, the previous user's data remains cached in their specific database.
   - **Dev Token/Session Refresh**: Switching users via the dropdown must fetch a fresh JWT token for the selected user from the backend, clear the old token in `localStorage`, and save the new token before reloading the page to ensure the correct credentials are used.
   - **Sync Checkpoint Validation on User Discrepancy**: The sync engine must track the last synced user ID inside the database metadata (`lastSyncUserId`). If a sync is triggered and the current user ID differs from `lastSyncUserId` (indicating the user has changed in between syncs), the sync engine must automatically invalidate the old sync checkpoint (clear the sync metadata) and reload the page to switch to the correct isolated database instance, preventing cross-user data leakage or pollution.

2. **Admin Visibility for All Operations**
   - **Requirement**: A user with the role `'admin'` must have visibility and management rights over all farms, fields, and associated agricultural events in the system.
   - **Backend Query Bypass**: When the backend processes requests from a user whose role is `'admin'`, it must bypass the standard ownership filters:
     - **Delta Sync (`GET /sync`)**: The sync endpoint must return all updated, non-deleted farms, fields, events, plans, applications, breaches, and movements in the entire database, regardless of which user owns them.
     - **Entity Listing (`GET /farms`, `GET /fields`, `GET /events`)**: Return all non-deleted records in the database.
     - **Entity Operations (GET, POST, PUT, DELETE)**: Allow reading, updating, and deleting any farm or field without restricting the action to the record's specific owner.

3. **Backend Role Verification**
   - **Requirement**: The backend must dynamically determine the requesting user's role from the database based on the `X-User-ID` header.
   - **Role Check**: Query the `users` table to fetch the user's role. If the user does not exist, default to `'user'`.
