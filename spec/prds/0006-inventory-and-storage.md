# PRD 0006: Inventory & Storage Management

## Overview
This document outlines the requirements for tracking agricultural inventory, specifically focusing on storage capacities, chemical products, and equipment. This consolidates requirements from PRD 0006 (Inventory and Equipment) and PRD 0026 (Storage Capacity Management).

## 1. Inventory Scope & Architecture
- **Portfolio-Level Ownership:** Inventory and equipment records belong to the user's overall portfolio (tenant_id).
- **Farm Association:** Individual items (e.g., equipment, chemical batches, storage facilities) can optionally be associated with specific farms or shared across the portfolio.
- **Backend Schema:** The system must use **Multiple Specific Tables** (e.g., `inventory_storage`, `inventory_chemicals`, `inventory_equipment`) rather than a single polymorphic table. This ensures strict data integrity constraints for category-specific fields.

## 2. Storage Capacity Management
- **Database Definition:** An `inventory_storage` table tracks:
  - `name`
  - `storage_type` (liquid, solid, chemical)
  - `capacity_volume`
  - `is_covered`
- **Supported Storage Types:**
  - **Liquid Storage:** Slurry tanks, lagoons, wash-water tanks.
  - **Solid Storage:** Dung heaps, poultry litter stores, solid manure pads.
- **Frontend Interaction:**
  - List View: Summary list/grid in `Inventory > Storage Capacity`.
  - Add/Edit/Delete Modals: Secure BREAD operations synchronized via the Delta Sync API.
- **Visualization:** Storage levels visualized using premium progress bars or circular gauges. Buttons must use the global pill style (`rounded-full`).

## 3. Storage Volume Prediction & Calibration
- **Prediction Model:** Automatically predict the growth of volume over time.
  - *Animal Contribution:* Calculate volume based on animal type/numbers and daily production rates (only during indoor housing periods).
  - *Environmental:* Account for expected/recorded rainfall for uncovered storage facilities.
  - *Operational:* Factor in wash-water and discrete bulk import events.
- **Calibration:** Users can manually override and set the current actual volume at any point.
- **Audit Log:** Maintain a historical audit log of manual calibrations to compare predicted vs. actual measurements.
- **Compliance Warning:** Enforce or warn based on minimum required storage capacities (e.g., 22 weeks generally, 26 weeks for pig/poultry).

## 4. Chemical and Pesticide Inventory
- **Digital Shelf:** Present the pesticide inventory as a "digital shelf" with clear categorization.
- **Tracking Data:** Track MAPP (Product Authorization Number), active ingredient, quantity on hand, and unit.
- **Event Linkage:** Provide visibility into available quantities to facilitate accurate event tracking and applications.

## 5. Equipment Tracking
- **LESSE Tracking:** Track Low Emission Sward Spreading Equipment (dribble bars, trailing shoes, soil injection).
- **Exceptions:** Log exemptions (e.g., inverted splash plates) and justification (e.g., impractical due to field slope).
- **FE Requirements:** Premium card-based UI highlighting LESSE compatibility and active statuses.

## 6. User Journeys
The following user journeys validate inventory and storage capacity tracking:

- **Storage Capacity E2E Journey (`test_storage_capacity.robot`)**: The integration testing suite must include an end-to-end storage capacity tracking journey. The journey must pre-create a farm via the API, log in to the UI, and navigate to the `Inventory > Storage Capacity` section. It must trigger the add storage action, fill in details (name, storage type, volume, and covered status), and test submitting the form by clicking the save button, and in a separate test, by pressing the Enter key. It must verify that only a single storage record is created in the database for each submission method. It must verify the storage facility appears in the UI list with the correct details, confirm it is synced and exists in the backend API, edit the record (testing both save button and enter key submissions), and then trigger deletion. It must confirm the storage is removed from the UI list and is no longer returned by the backend API.
