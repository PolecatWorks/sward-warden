# PRD 0023: Storage Capacity Management

## Overview
This document specifies the feature requirements for allowing users to manage their storage capacities for livestock manure, chemical fertilizers, and other organic materials. This builds upon PRD 0006 by providing explicit instructions on DB schema, Backend APIs (BREAD), and UI interactions required for users to log, view, edit, and delete their storage capabilities.

## Scope
The feature will cover:
1. **Backend Infrastructure**: Creating the database tables and required synchronization endpoints.
2. **Frontend Storage Layer**: Incorporating the new data into the offline-first RxDB architecture.
3. **UI Integration**: Replacing the placeholder views in the Inventory & Equipment section with interactive forms and lists to manage `inventory_storage` records.

## Requirements

### 1. Database Definition
An `inventory_storage` table needs to be created to track storage data.
- **Tenant Scope**: Must belong to the user's overall portfolio (`tenant_id`).
- **Farm Scope**: Can optionally be associated with a specific `farm_id`. If omitted, it is considered shared across the portfolio.
- **Data Points**:
  - `name`: Text (Name of the storage facility)
  - `storage_type`: Enum or Text (e.g., 'liquid', 'solid', 'chemical')
  - `capacity_volume`: Decimal (Total capacity in cubic meters or appropriate unit)
  - `is_covered`: Boolean (Indicates if the storage is covered to prevent rainfall accumulation)
  - Standard auditing fields: `id`, `created_at`, `updated_at`, `server_id` (for sync), `tenant_id`.

### 2. Backend Support (BREAD APIs)
Because the frontend uses an outbox pattern for synchronization, BREAD (Browse, Read, Edit, Add, Delete) operations are handled via a unified Delta Sync API.
- **Delta Sync Integration**: The `/sync` endpoint must be updated to return delta updates for `inventory_storage`.
- **Entity Processing**: The sync endpoint must process incoming `inventory_storage` mutations from the frontend's outbox and persist them to the database.

### 3. Frontend UI Interaction
The user interface should allow interaction with storage records.
- **List View**: Display a summary list or grid of existing storage capacities in the `Inventory > Storage Capacity` section.
- **Add/Edit Modal or Form**: Provide a UI to add a new storage facility or edit an existing one, capturing `name`, `type`, `capacity`, `farm` (optional), and `covered` status.
- **Delete Mechanism**: Allow users to safely delete a storage facility from their inventory.

## References
- Expanding on Storage Capacity concepts discussed in [PRD 0006](./0006-inventory-and-equipment.md).