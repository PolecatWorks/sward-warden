# Specification 0006-06: Portfolio-Level Inventory & Equipment

**State**: Complete

## 1. Overview
This specification details the portfolio-level organization of inventory and equipment records, allowing them to exist at the user account level rather than being coupled to a single farm.

## 2. Requirements

- **Portfolio-Level Ownership**: Inventory and equipment records (including slurry storage tanks, chemical inventory shelves, and machinery fleets) belong to the user's overall portfolio/account rather than a single farm.
- **Farm Association**: Individual inventory items can be associated with or shared across multiple farms as needed.
- **Navigation access**: Accessible from the top-level navigation, making it farm-independent.

## 3. Changes

- **Frontend routing**: Registered `/inventory-and-equipment` routes and sub-routes at the top-level rather than nested under individual farms, verifying they render and act on portfolio-wide datasets.
