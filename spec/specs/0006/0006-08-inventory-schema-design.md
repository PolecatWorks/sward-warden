# Specification 0006-08: Inventory Database Schema Design

## 1. Overview
This specification details the database schema design for the inventory and equipment tracking system. Based on the PRD recommendations, we are adopting **Option 2: Multiple Specific Tables** (Class Table Inheritance / Concrete Table) to ensure data integrity and domain clarity.

## 2. General Architecture
Inventory items belong to the user's overall portfolio (tenant) but can be associated with specific farms. To support distinct attributes and constraints for each category of inventory, separate tables will be created.

### 2.1 Shared Base Interface (Logical)
While there is no single database table, all concrete tables share common conceptual fields:
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key for portfolio scoping)
- `farm_id` (UUID, Foreign Key, Nullable - if associated with a specific farm)
- `name` (String)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 3. Concrete Tables

### 3.1 `inventory_storage`
Stores details about physical storage facilities for manure and chemicals.
- **Specific Fields:**
  - `storage_type` (Enum: liquid, solid, etc.)
  - `capacity_volume` (Decimal, NOT NULL)
  - `is_covered` (Boolean, default FALSE)
  - `surface_area` (Decimal, optional, used for rainfall calculations if uncovered)

### 3.2 `inventory_chemicals`
Stores details about plant protection products and chemical fertilizers.
- **Specific Fields:**
  - `mapp_number` (String, NOT NULL - Product Authorization Number)
  - `active_ingredient` (String)
  - `quantity_on_hand` (Decimal)
  - `unit` (String)

### 3.3 `inventory_equipment`
Stores details about farm machinery and spreading equipment.
- **Specific Fields:**
  - `equipment_type` (Enum: tractor, trailing_shoe, dribble_bar, splash_plate, etc.)
  - `is_lesse_compliant` (Boolean)
  - `calibration_date` (Timestamp)

### 3.4 `inventory_contracts`
Stores details regarding manure import/export agreements.
- **Specific Fields:**
  - `contract_type` (Enum: import, export)
  - `partner_name` (String)
  - `origin_address` (String)
  - `destination_address` (String)
  - `agreed_volume` (Decimal)
  - `start_date` (Timestamp)
  - `end_date` (Timestamp)

## 4. Querying and Linking

- **Global Queries:** When the UI needs a consolidated list of "all inventory", the backend will perform independent queries against the necessary tables and combine them at the application layer, or use predefined SQL `UNION ALL` views if strictly necessary for reporting.
- **Event Linking:** Farm events that refer to inventory items will use specific foreign keys corresponding to the exact table (e.g., an export event will have a `contract_id` foreign key pointing specifically to `inventory_contracts(id)`).
