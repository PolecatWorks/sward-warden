# PRD 0011: Offline Capabilities

## Overview
This document outlines the offline support requirements for the sward management application, enabling users to work without network connectivity and ensuring data synchronization when the connection is restored.

## Core Patterns

### A. The "Local-First" Data Flow
The app should never wait for the network to update the UI.
- **Write:** User saves data → Write to local storage (IndexedDB/SQLite) → UI updates immediately.
- **Sync:** A background service detects a connection → Reads "pending" records from local storage → Pushes to Postgres.
- **Resolve:** Server responds → Local storage marks the record as "synced."

### B. The Outbox Pattern (Queuing)
When offline, intended actions must not fail. Instead, they are stored in a Synchronization Queue (an "Outbox" table in the local DB).
- **Table Schema:** `id`, `action_type` (POST/PUT/DELETE), `payload` (JSON), `timestamp`, `status` (pending/failed).
- **Background Sync:** Use the Web Background Sync API (via Angular Service Workers) to trigger queue processing even if the user has closed the app.

### C. Delta Sync & Checkpoints (Pulling)
To avoid downloading the entire Postgres database every time:
- Add an `updated_at` (timestamp) and `is_deleted` (soft delete) column to every Postgres table.
- The Angular app stores a **Last Sync Checkpoint**.
- **Request:** `GET /api/sync?since=2026-04-25T10:00:00Z`
- **Response:** Only records modified or deleted since that specific moment.

### D. Conflict Resolution
When the same record is edited offline and on the server, a conflict resolution strategy is required. One of the following should be used:
- **Last Write Wins (LWW):** The most recent timestamp wins (easiest, but can lose data).
- **Semantic Merging:** Merge specific fields (e.g., keep the server's status but the mobile's notes).
- **Version Headers:** Use ETags or a `version_id`. If versions don't match, the server rejects the push and sends current data back to the mobile device for the user to resolve.

## User Interface
- Monitor network status and provide an indicator on the UI. The application will use an `isOnline$` observable stream (combining window `online` and `offline` events) to display the current connectivity state to the user.
