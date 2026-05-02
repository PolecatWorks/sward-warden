# Specification 0011-02: Network Status and Sync FE

## Goal
Implement network connectivity detection and a visual sync-state indicator so users always know whether the application is online, offline, or actively syncing.

## State: Complete

## Technical Plan
1. **Network Status Service (`NetworkService`)**:
   - Create `src/app/services/network.service.ts` exposing an `isOnline$` observable.
   - Combine the browser `window.online` and `window.offline` events into a single reactive stream using RxJS `fromEvent` and `merge`.
   - Initialise with the current value of `navigator.onLine`.
2. **Sync State Service (`SyncStateService`)**:
   - Create `src/app/services/sync-state.service.ts` exposing a `syncState$` observable.
   - The observable emits one of three states: `offline`, `syncing`, or `synced`.
   - State transitions: when `isOnline$` emits `false` → `offline`; when sync operations begin → `syncing`; when all sync operations complete → `synced`.
   - This service will be consumed by the sync engine in later specs (0011-04, 0011-05) to drive state transitions. For this spec, provide a public API (`setSyncing()`, `setSynced()`) that the sync layer will call.
3. **Sync Status Indicator Component**:
   - Create a small, reusable `SyncStatusComponent` displaying an icon and optional label reflecting the current `syncState$`.
   - Use Material Symbols for icons: e.g., `cloud_off` (offline), `sync` (syncing, with a CSS rotation animation), `cloud_done` (synced).
   - The component should be embedded in the `MainLayoutComponent` header/toolbar so it is visible on all screens.
4. **Styling**:
   - Offline state: muted/grey icon with a subtle "Offline" label.
   - Syncing state: animated rotating icon in the primary colour.
   - Synced state: green/success-coloured icon, label hidden after a brief delay.
5. **Testing**:
   - Unit tests for `NetworkService` verifying observable emissions on simulated online/offline events.
   - Unit tests for `SyncStateService` verifying correct state transitions.
   - Unit tests for `SyncStatusComponent` verifying the correct icon/label is rendered per state.

## Acceptance Criteria
- `isOnline$` correctly reflects the browser's network status.
- The sync status icon is visible in the app header on all screens.
- Icon and label update reactively when the network state or sync state changes.
- All unit tests pass.
