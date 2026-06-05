# Specification 0011-06: Self-Healing and Recovery Mechanisms

## Overview
This specification details the self-healing and recovery mechanisms needed to ensure the robustness of the offline sync engine. It covers scenarios where the local RxDB database becomes corrupted, sync state is lost, or the application needs to gracefully recover from an inconsistent state between the client and server.

## Requirements

1.  **Database Corruption Detection & Reset:**
    *   The application must detect initialization failures or persistent errors when interacting with RxDB.
    *   Upon detecting an unrecoverable state, the application must provide a mechanism to safely wipe the local database.
    *   After wiping, the application must trigger a full initial synchronization (from `timestamp=0`) to reconstruct the local state from the server.

2.  **Orphaned Outbox Entry Handling:**
    *   The application must identify "stuck" entries in the Outbox queue (e.g., status 'pending' or 'failed' for longer than a predefined threshold, like 24 hours).
    *   The application should attempt to retry these entries with an exponential backoff strategy.
    *   If an entry fails permanently (e.g., HTTP 400 Bad Request, indicating invalid data), it should be marked as 'permanently_failed' and moved out of the active queue to prevent blocking subsequent syncs.
    *   A UI notification should alert the user to permanently failed sync actions.

3.  **Sync State Verification (Consistency Check):**
    *   Periodically (e.g., once a day on startup when online), the client should compare a hash of its local primary keys and timestamps with the server's state for core entities.
    *   If a mismatch is found (indicating delta sync missed an update or local data was corrupted silently), a forced full sync should be triggered for the affected collections.

4.  **Graceful Degradation:**
    *   If the local database cannot be initialized at all (e.g., browser storage limit reached), the application must fallback to an "online-only" mode, bypassing local storage and communicating directly with the backend REST APIs.
    *   The user must be notified that offline mode is unavailable.

## Implementation Details

*   **RxDB Error Handling:** Wrap database initialization and queries in robust `try...catch` blocks. Listen to database-level error events (`db.error$`).
*   **Wipe Functionality:** Implement a `resetDatabase()` function that calls `removeRxDatabase` and clears any associated `localStorage` flags (like the sync checkpoint).
*   **Retry Logic:** Enhance the `SyncEngineService.processOutbox()` method to track attempt counts and timestamps for exponential backoff.
*   **Fallback Service:** Create an interface for data access. Implement an `RxDbDataService` (default) and a `RestDataService` (fallback). Use Angular's dependency injection to switch implementations based on storage availability.

## Acceptance Criteria

*   Simulating a corrupted IndexedDB triggers a local database reset and subsequent full sync upon next launch.
*   Simulating a 400 error from the server for a specific Outbox entry marks it as permanently failed without stopping the sync process for other valid entries.
*   The application successfully starts in "online-only" mode if IndexedDB is forcefully disabled in the browser developer tools, presenting a warning to the user.
