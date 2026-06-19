# PRD 0006: Inventory and Equipment Tracking

## Overview
This document outlines the requirements for tracking inventory and equipment. Maintaining an accurate inventory of storage capacities, chemical products, and equipment types is critical for compliance with environmental regulations (e.g., Farm Sustainability Standards).

## Inventory Scope & Ownership
- **Portfolio-Level Ownership**: Inventory and equipment records are independent of a single farm. They belong to the user's overall portfolio/account.
- **Farm Association**: Although owned at the portfolio level, individual inventory items (e.g., equipment, chemical batches, or storage facilities) can be associated with specific farms or shared across multiple farms as needed.

## Key Requirements

1. **Storage Capacity Tracking**
   - Track livestock manure storage capacities (minimum 22 weeks for most enterprises, 26 weeks for pig/poultry enterprises).
   - Track other chemical and organic fertiliser storage limits and current capacities.

2. **Chemical and Pesticide Inventory**
   - Record and maintain an inventory of Plant Protection Products (PPPs).
   - Track specific data points: Product Authorization Number (MAPP).
   - Provide visibility into available quantities to facilitate accurate event tracking.

3. **Equipment Tracking**
   - Record farm equipment details, specifically focusing on Low Emission Sward Spreading Equipment (LESSE) such as dribble bars, trailing shoes, and soil injection systems.
   - Record exceptions, like inverted splash plates, and the justification (e.g., impractical due to field slope).

4. **Import/Export Contracts**
   - Document written contractual agreements for manure movement onto or off the farm.
   - Track origin, destination, volume, and contract length for compliance reporting.

## FE Requirements
- **Storage Visualization**: Sward storage levels should be visualized using high-quality progress bars or circular gauges that match the premium dashboard aesthetic.
- **Equipment Inventory**: Use the premium card-based FE to display equipment details, highlighting LESSE compatibility and active statuses.
- **Digital Shelf**: The pesticide inventory should be presented as a "digital shelf" with clear categorization and easy access to MAPP details.

## Backend Schema Design Options
When designing the database architecture for the inventory and equipment tracking, we must decide whether to use a single table for all inventory items with a type filter, or specific tables for each category (Storage, Chemicals/Pesticides, Equipment, Import/Export Contracts).

### Option 1: Single Combined Table (Single Table Inheritance)
All inventory and equipment items are stored in one central `inventory_items` table. A `type` column identifies the category (e.g., 'storage', 'chemical', 'equipment', 'contract'). Category-specific attributes are stored either in nullable sparse columns or a `JSONB` metadata field.

**Pros:**
- **Simplified Global Queries:** Extremely easy to fetch a user's entire portfolio inventory in a single query without complex `UNION`s or multiple `JOIN`s.
- **Easier Schema Maintenance:** Adding a new, simple inventory type doesn't require creating a new table or managing new foreign keys.
- **Unified References:** Any event or log linking to an inventory item only needs to point to a single table and ID.

**Cons:**
- **Weak Data Integrity:** Cannot enforce non-null constraints natively at the database level for category-specific fields (e.g., a `mapp_number` must be required for a chemical, but not for a tractor).
- **Complex Validation Logic:** Shifts the burden of structural data validation entirely to the application layer.
- **Messy Schema:** If using sparse columns, the table becomes very wide with many NULLs. If using `JSONB`, query performance on specific attributes might degrade without specialized indexing.

### Option 2: Multiple Specific Tables (Class Table Inheritance / Concrete Table)
Each category of inventory has its own dedicated table (e.g., `inventory_storage`, `inventory_chemicals`, `inventory_equipment`, `inventory_contracts`).

**Pros:**
- **Strict Data Integrity:** Database-level constraints (like NOT NULL, UNIQUE, Foreign Keys) can be strictly enforced for specific fields (e.g., `capacity_volume` for storage, `mapp_number` for chemicals).
- **Clear schema definitions:** The schema is self-documenting and strictly typed, making it easier to understand the exact data shape required for each item type.
- **Optimized Indexing:** Indexes can be highly optimized for the specific access patterns of each item category.

**Cons:**
- **Complex Global Queries:** Creating a consolidated view of all "inventory" for a user requires `UNION ALL` views or multiple distinct queries.
- **Complicated Event Linking:** If a farm event needs to link to an arbitrary inventory item, it either requires polymorphic associations (an `item_id` and `item_type` column) or multiple nullable foreign keys, which can complicate ORM modeling.
- **More Tables to Manage:** Higher overhead in terms of migrations and backend models.

**Recommendation:**
Given the highly distinct nature of these categories—where a Manure Import Contract shares almost no data attributes with a Tractor or a Chemical Batch—**Option 2 (Multiple Specific Tables)** is generally preferable to ensure data integrity and domain clarity, despite the slight overhead in unified querying.
