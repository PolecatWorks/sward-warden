# Specification 0001-26: Dexie.js Client Database Migration

**State**: Open

## 1. Overview
In accordance with PRD 0001 (Section 5 Offline Capabilities) and PRD 0013 (Section 1 Multi-User Data Isolation), the frontend requires an unconstrained, reactive client-side database.
The current RxDB free core imposes a strict limit of 13 collections (`NON_PREMIUM_COLLECTION_LIMIT = 13`, error `COL23`). SwardWarden already defines 14 collections (`farms`, `fields`, `events`, `soil_analyses`, `fertilisation_plans`, `farm_records`, `fertiliser_applications`, `organic_manure_applications`, `compliance_breaches`, `sward_movements`, `inventory_storage`, `inventory_chemicals`, `outbox`, and `metadata`), which causes RxDB initialization crashes and application lockup.

This specification details replacing RxDB with **Dexie.js** (`dexie`) directly, utilizing Dexie's native `liveQuery` Observable integration with RxJS. Dexie is the native IndexedDB wrapper that RxDB itself uses underneath, but Dexie has zero artificial collection limits, lighter footprint, native Typescript table typings, and full support for unlimited domain tables and metadata stores.

## 2. Requirements & Technical Plan

### 1. Dexie Database Definition (`AppDatabase` / `DexieService`)
- Define an Angular injectable database service (`DexieService` or `AppDatabase extends Dexie`) located in `sw-fe-container/src/app/services/database/`.
- Provide typed `Table<T, Key>` stores for all 14 domain entities:
  - `farms`: primary key `id`, indexed by `user_id`, `name`, `syncStatus`, `updated_at`.
  - `fields`: primary key `id`, indexed by `farm_id`, `name`, `syncStatus`, `updated_at`.
  - `events`: primary key `id`, indexed by `farm_id`, `field_id`, `event_type`, `date`, `syncStatus`.
  - `soil_analyses`: primary key `id`, indexed by `field_id`, `sample_date`, `syncStatus`.
  - `fertilisation_plans`: primary key `id`, indexed by `field_id`, `crop_type`, `year`, `syncStatus`.
  - `farm_records`: primary key `id`, indexed by `farm_id`, `record_type`, `syncStatus`.
  - `fertiliser_applications`: primary key `id`, indexed by `field_id`, `date`, `syncStatus`.
  - `organic_manure_applications`: primary key `id`, indexed by `field_id`, `date`, `syncStatus`.
  - `compliance_breaches`: primary key `id`, indexed by `farm_id`, `field_id`, `breach_date`, `syncStatus`.
  - `sward_movements`: primary key `id`, indexed by `farm_id`, `movement_date`, `syncStatus`.
  - `inventory_storage`: primary key `id`, indexed by `farm_id`, `name`, `syncStatus`.
  - `inventory_chemicals`: primary key `id`, indexed by `storage_id`, `farm_id`, `name`, `syncStatus`.
  - `outbox`: primary key `id`, indexed by `status`, `created_at`, `retryCount`.
  - `metadata`: primary key `id` (key-value store for `checkpoint`, `lastSyncUserId`, `lastSyncTime`).

### 2. Multi-Tenant User Isolation
- Like the previous RxDB database setup, the Dexie database name must be dynamically scoped per tenant: `swarddb_<userId>`.
- Upon user switch or login, the database instance for the authenticated user is resolved.

### 3. Reactive Observables (`liveQuery` & RxJS)
- Provide reactive query helper functions mapping Dexie's `liveQuery(() => table.toArray())` into standard RxJS `Observable<T[]>` via `from(liveQuery(...))`.
- Ensure components consuming reactive data feeds continue to receive real-time updates when records are added, modified, or deleted locally.

### 4. Integration with `FarmManagementService` & `SyncEngineService`
- Update `FarmManagementService` CRUD operations to execute Dexie table methods (`table.get`, `table.add`, `table.put`, `table.delete`, `table.bulkPut`, `table.bulkDelete`).
- Update `SyncEngineService` to:
  - Query and mutate `outbox` records via Dexie.
  - Store and retrieve sync checkpoints from the `metadata` table.
  - Execute concurrent batch operations (`table.bulkPut`, `table.bulkDelete`) inside `Promise.all` across domain tables during delta pull synchronization.

### 5. Self-Healing & Fallback
- Preserve self-healing behavior: if opening IndexedDB encounters corruption or version errors, attempt a clean wipe and recreation (`Dexie.delete(dbName)`).
- If database initialization fails on second attempt, set `fallbackToRest$` to `true` to enable direct REST communication.

### 6. Deprecate and Remove RxDB
- Remove `rxdb` package and RxDB plugins (`@types/pouchdb`, `pouchdb-adapter-memory`, `storage-dexie`, `dev-mode`, etc.) from `sw-fe-container/package.json`.
- Supercede specification `0001-10` (RxDB Local Database Setup).

## 3. Verification Criteria
- `sw-fe-container` compiles with `dexie` and zero compiler errors.
- All 14 entity stores and metadata operate without table limits or `COL23` errors.
- Unit test suite (`npm test -- --watch=false --browsers=ChromeHeadless`) passes.
- Navigating to `/farms` in the browser renders successfully without console errors.
