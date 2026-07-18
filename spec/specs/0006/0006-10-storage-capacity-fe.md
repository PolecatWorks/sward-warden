# Specification 0006-10: Storage Capacity Frontend Implementation

## Status
Complete

## Overview
This specification details the frontend modifications to support offline-first BREAD operations and UI views for `inventory_storage`, per PRD 0006.

## 1. RxDB Schema Definition
Add `InventoryStorageDocType` to `sw-fe-container/src/app/services/rxdb/schemas.ts`:

```typescript
export interface InventoryStorageDocType {
  id: string; // Local uuid
  serverId?: number;
  uuid?: string;
  farm_id?: number | null;
  name: string;
  storage_type: string;
  capacity_volume: number;
  current_volume?: number | null;
  is_covered: boolean;
  syncStatus: SyncStatus;
  updatedAt: string;
}
```

Add the JSON schema for `inventory_storage` in the same file and register the collection in `RxdbService`.

## 2. SyncEngine Integration
Update `SyncEngineService`:
1.  **Pull Sync**: Map incoming `inventory_storage` records from the server to local RxDB documents.
2.  **Push Sync**: Ensure `OutboxDocType` can serialize and push `inventory_storage` mutations.

## 3. UI Components
Update the `/inventory/storage` route (`sw-fe-container/src/app/storage-capacity/storage-capacity.component.ts|html`):
1.  **List View**: Replace placeholder progress bars with a data table or card list subscribing to the `inventory_storage` RxDB collection.
2.  **Creation/Edit**: Include an inline form or a modal dialogue to capture: Name, Type (Liquid/Solid), Capacity Volume, Associated Farm (dropdown of available farms), and Covered Status.
3.  **Deletion**: Add a delete action with a confirmation prompt.
