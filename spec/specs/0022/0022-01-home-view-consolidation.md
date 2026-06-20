# Specification 0022-01: Home View Consolidation

## 1. Overview
This specification details the frontend implementation required to streamline the Sward Warden user interface by consolidating the "Home", "Compliance and Dashboard", and "Reporting" views into a single, actionable "Unified Command Center". This aligns with **Option A** from PRD 0022.

## 2. Unified Command Center Layout

The new Home view will act as a central hub consisting of three distinct vertical sections.

### 2.1 Top Section: Immediate Actions
- **Daily Action Traffic Light Component:**
  - A prominent visual indicator (Green, Yellow, Red) that dictates if it is safe and legal to perform major actions (like spreading slurry) today.
  - **Logic Inputs:** Integrates weather forecasts (rainfall) and Northern Ireland compliance rules (closed spreading periods).
- **Critical Alerts Feed:**
  - A prioritized list widget displaying immediate warnings or required actions.
  - Examples: "Field A requires a buffer zone due to recent rainfall", "Approaching nitrogen limit on Farm X".

### 2.2 Middle Section: Contextual Context
This section dynamically adjusts based on the user's portfolio.

#### Single-Farm Users
- Bypasses farm-level aggregation.
- Displays a consolidated list of critical field-level issues and upcoming tasks specific to their single farm.
- Provides direct drill-down links to the specific field details.

#### Multi-Farm Users
- Displays a summary of critical issues grouped by farm.
- Example representation: A card for "Farm Alpha" showing "2 Compliance Warnings", and a card for "Farm Beta" showing "All Clear".
- Clicking a farm card navigates to a drilled-down view showing the specific field issues for that farm.

### 2.3 Bottom Section: Quick Links & Summaries
- **Bento-Grid Widgets:** Small, summary-focused cards for secondary information.
  - Inventory summary (e.g., current storage capacities).
  - Upcoming scheduled events calendar snippet.
- **Deep-Dive Links:** Quick navigation buttons to dedicated modules like "Reporting" or the full "Inventory" page.

## 3. Navigation Changes
- **Remove:** Remove "Compliance" and "Dashboard" from the main application navigation menu.
- **Retain:** Keep "Home" (pointing to the new Unified Command Center), "Fields", "Farms" (only visible for multi-farm users), "Inventory", and "Reporting".

## 4. Alert Filtering Logic
- The backend API serving the alerts feed must include filtering parameters to support the context-aware display.
- Global alerts (e.g., national closed periods) must be de-duplicated for multi-farm users and displayed at the top level, rather than repeated per farm.
