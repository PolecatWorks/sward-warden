# PRD 0026: Storage Capacity Management

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


### 4. Storage Volume Prediction Model
- Provide a mechanism to predict the growth of volume within storage facilities over time.
- **Animal Contribution**: Calculate volume increases based on animal type (e.g., dairy cows, beef cattle, pigs, chickens). The calculation must multiply the number of animals by a baseline daily production rate. Importantly, this contribution should *only* be calculated for the duration animals are housed indoors.
- **Environmental Factors**: For uncovered storage facilities (like open lagoons), the prediction model must factor in expected or recorded rainfall, which adds to the total volume.
- **Operational Factors**: The model must account for additional liquid inputs, such as dairy parlor wash-water, as well as discrete bulk import events (e.g., importing abattoir blood or dung).

### 5. Volume Calibration and Auditing
- Allow users to manually override and set the current actual volume of a storage facility at any point in time.
- Maintain a historical audit log of these manual calibrations. This log allows the system and the user to compare predicted volumes against actual measurements, enabling future refinement and calibration of baseline prediction rates.

### 6. Regulatory Compliance
- Ensure the application enforces or warns based on minimum required storage capacities (e.g., 22 weeks for most enterprises, 26 weeks for pig and poultry).

### 7. Storage Visualization
- Sward storage levels should be visualized using high-quality progress bars or circular gauges that match the premium dashboard aesthetic.


### 8. Storage Capacity Tracking
- Track livestock manure storage capacities.
- Track distinct types of storage facilities, including:
  - **Liquid Storage**: Slurry tanks, lagoons, wash-water tanks.
  - **Solid Storage**: Dung heaps, poultry litter stores, solid manure pads.
- Differentiate between covered and uncovered storage facilities.
- Track other chemical and organic fertiliser storage limits and current capacities.
