# PRD 0011: Offline Capabilities

## Overview
This document outlines the offline support requirements for the sward management application, enabling users to work without network connectivity and ensuring data synchronization when the connection is restored. The application will leverage **RxDB** to facilitate robust offline synchronization and local-first data flows.

## Core Patterns

### A. The "Local-First" Data Flow
The app should never wait for the network to update the FE.
- **Write:** User saves data → Write to local storage (RxDB) → FE updates immediately.
- **Sync:** A background service detects a connection → Reads "pending" records from RxDB local storage → Pushes to Postgres.
- **Resolve:** Server responds → Local storage marks the record as "synced."

### B. The Outbox Pattern (Queuing)
When offline, intended actions must not fail. Instead, they are stored in a Synchronization Queue (an "Outbox" table in the RxDB local DB).
- **Table Schema:** `id`, `action_type` (POST/PUT/DELETE), `payload` (JSON), `timestamp`, `status` (pending/failed).
- **Background Sync:** Use the Web Background Sync API (via Angular Service Workers) to trigger queue processing even if the user has closed the app.

### C. Delta Sync & Checkpoints (Pulling)
To avoid downloading the entire Postgres database every time:
- Add an `updated_at` (timestamp) and `is_deleted` (soft delete) column to every Postgres table.
- The Angular app stores a **Last Sync Checkpoint** using RxDB.
- **Request:** `GET /api/sync?since=2026-04-25T10:00:00Z`
- **Response:** Only records modified or deleted since that specific moment.

### D. Conflict Resolution
When the same record is edited offline and on the server, a conflict resolution strategy is required. One of the following should be used:
- **Last Write Wins (LWW):** The most recent timestamp wins (easiest, but can lose data).
- **Semantic Merging:** Merge specific fields (e.g., keep the server's status but the mobile's notes).
- **Version Headers:** Use ETags or a `version_id`. If versions don't match, the server rejects the push and sends current data back to the mobile device for the user to resolve.

### E. Self-Healing and Recovery Mechanisms
To prevent the application from entering a permanently locked or degraded state due to local database corruption, IndexedDB/Dexie limits, or schema mismatches (such as when a new version of the UI is deployed with updated schemas):
- **Initialization Failure Detection:** The application must intercept any initialization errors or failures when setting up or adding collections to the local database.
- **Auto-Recovery via Database Wipe:** If initialization fails, the application should automatically wipe the local database (e.g. calling `removeRxDatabase` and clearing related caches) and attempt initialization again from scratch.
- **Data Reconstruction (Full Sync):** Following a database wipe, the application must perform a full initial synchronization (starting from the epoch checkpoint) to reconstruct the local state from the server.
- **Graceful Online Fallback:** In the event that local storage is completely blocked or corrupted beyond recovery (e.g. browser storage permissions disabled), the app must gracefully degrade to an online-only fallback mode, making direct API calls to the server rather than using the local database.
- **Outbox Queue Management:** Stuck or permanently invalid outbox actions (e.g. HTTP 400 Bad Request) must be marked as permanently failed rather than blocking the synchronization queue indefinitely.

### F. Background Service Workers
- The application should use service workers to maintain the synchronisation in the background, ensuring data is always up-to-date and outbox queues are processed reliably without requiring the application to be actively open in the foreground.

## User Interface
- Monitor network status and provide an indicator on the FE. The application will use an `isOnline$` observable stream (combining window `online` and `offline` events) to display the current connectivity state to the user.
- Display a status icon on the screen indicating the current sync state: "offline", "syncing", or "synced".
