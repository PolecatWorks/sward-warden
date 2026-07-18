# Specification 0006-09: Storage Capacity Backend Implementation

## Status
Complete

## Overview
This specification details the backend implementation for managing `inventory_storage` records as described in PRD 0006.

## 1. Database Schema
Create a new migration `0019_inventory_storage.sql` in `sw-be-container/migrations/`.

```sql
CREATE TABLE inventory_storage (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id BIGINT REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    storage_type VARCHAR(50) NOT NULL,
    capacity_volume NUMERIC NOT NULL,
    current_volume NUMERIC,
    is_covered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_storage_tenant ON inventory_storage(tenant_id);
```

## 2. Model Definition
Add `InventoryStorage` struct to `sw-be-container/src/models.rs`:

```rust
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct InventoryStorage {
    #[serde(skip_deserializing)]
    pub id: i64,
    pub uuid: Uuid,
    #[serde(skip_deserializing)]
    pub tenant_id: i64,
    pub farm_id: Option<i64>,
    pub name: String,
    pub storage_type: String,
    pub capacity_volume: f64,
    pub current_volume: Option<f64>,
    pub is_covered: bool,
    #[serde(skip_deserializing)]
    pub created_at: chrono::DateTime<chrono::Utc>,
    #[serde(skip_deserializing)]
    pub updated_at: chrono::DateTime<chrono::Utc>,
}
```

Add this entity to the `SyncResponse` and `SyncQuery` models.

## 3. Delta Sync API
Update the delta sync logic in the backend:
1.  **Read (Pull Sync)**: Retrieve `inventory_storage` records where `tenant_id` matches the caller and `updated_at > last_sync_timestamp`.
2.  **Write (Push Sync)**: Process incoming `inventory_storage` mutations from the outbox, handling INSERT, UPDATE, and DELETE (via tombstoning if implemented, or hard delete) operations. Ensure constraints like tenant ownership are verified.
