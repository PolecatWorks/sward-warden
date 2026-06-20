# Specification 0004-09: Organic Materials Tracking and Record Entry UX

## 1. Overview
This specification details the technical requirements for tracking various types of organic materials (such as standard liquid slurry, solid dung, poultry litter, abattoir blood, and anaerobic digestate) during import, export, and spreading events. It also covers the frontend user experience (UX) requirements for recording these events efficiently, handling varying unit measurements.

## 2. Backend Requirements

### 2.1 Supported Organic Materials Types
The backend must support an extensible list of organic materials. Each material type may have different default units of measurement (e.g., cubic meters for liquid, tonnes for solid).

The core supported materials are:
- `liquid_slurry_cattle` (Liquid, $m^3$)
- `liquid_slurry_pig` (Liquid, $m^3$)
- `solid_dung` (Solid, tonnes)
- `poultry_litter` (Solid, tonnes)
- `abattoir_blood` (Liquid, $m^3$ or litres)
- `anaerobic_digestate` (Liquid/Solid depending on processing, $m^3$/tonnes)

### 2.2 Import and Export Records
For moving organic material onto or off the farm, the backend models must record:
- **Quantity:** Numeric value.
- **Unit of Measurement:** Associated with the quantity (e.g., $m^3$, tonnes).
- **Date of Movement:** Timestamp.
- **Type of Material:** Reference to the organic material type.
- **Consignee Details:** Name and address.
- **Consignor Details:** Name and address.
- **Transporter Details:** Name and address.
- **Contract Reference:** Optional link to a written contractual agreement (stating parties, origin, destination, volume, length of contract).

## 3. Frontend Requirements (Record Entry UX)

### 3.1 Optimized Event Recording Pattern
Forms for recording spreading, importing, or exporting events must utilize the "Record Event" pattern:
- **Large Touch Targets:** Ensure buttons and input fields are easily tappable on mobile devices.
- **Clear Iconography:** Use distinct icons for different material types (e.g., droplets for liquids, pile icons for solids) and actions.

### 3.2 Material Selection and Unit Handling
- **Material Selector:** A visually prominent dropdown or card selection to choose the material type.
- **Dynamic Units:** When a material type is selected, the unit measurement input must automatically update to the appropriate unit (e.g., switching from $m^3$ to tonnes).
- **Validation:** Ensure that the input quantity is validated against the selected unit, and appropriate tooltips or hints are displayed if different spreading implications exist for the selected material.

### 3.3 Dashboard Integration
- The Import/Export tracking should be presented in a dedicated Bento-style overview on the respective dashboards to provide quick insights into manure movements and associated reporting deadlines (e.g., NIEA annual submission dates).
