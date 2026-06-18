# Technical Specification: 0022-01 Home View Consolidation

**State**: Open

## 1. Overview
This specification details the implementation for consolidating the fragmented views ("Home", "Compliance and Dashboard", and "Reporting") into a single, highly actionable, and context-aware "Home" view, following **Option A: The Unified Command Center** as defined in PRD 0022.

The goal is to provide a central hub displaying critical tasks, compliance alerts, and actionable intelligence based on the user's farm count (single-farm vs. multi-farm).

## 2. Proposed Changes

### 2.1 Navigation Updates
- **Remove existing navigation items:** Remove the standalone "Compliance" and "Dashboard" items from the main sidebar/bottom navigation menu in `sw-fe-container`.
- **Retain existing items:** "Home", "Fields", "Farms" (conditionally for multi-farm users), "Inventory", and "Reporting" remain in the navigation menu.

### 2.2 Home View Layout (`sw-fe-container/src/app/home`)
The Home component will be refactored into three distinct sections:

#### Top Section: Immediate Actions
- **Daily Action Traffic Light Widget:**
  - A visual indicator (Green/Yellow/Red) showing the safety/legality of spreading slurry or taking major actions today.
  - Logic based on current weather/rainfall and Northern Ireland compliance rules (e.g., closed spreading periods).
- **Critical Alerts Feed Widget:**
  - A prioritized list of immediate actions required or warnings (e.g., "Field A requires a buffer zone due to recent rainfall", "Approaching nitrogen limit on Farm X").

#### Middle Section: Contextual Context
The display logic here depends dynamically on whether the user manages a single farm or multiple farms:
- **Single-Farm View:**
  - Bypasses farm-level summary.
  - Displays a consolidated list of critical *field-level* issues and upcoming tasks for that single farm.
- **Multi-Farm View:**
  - Displays a summary of critical issues grouped by *farm* (e.g., "Farm Alpha: 2 Compliance Warnings", "Farm Beta: All Clear").
  - Clicking on a farm entry drills down into specific field issues for that farm.
  - If an alert applies globally across all farms (e.g., a national closed spreading period), it should be displayed once as a global alert.

#### Bottom Section: Quick Links & Summaries
- **Bento Grid Widgets:**
  - Summaries of inventory (e.g., current slurry storage capacity).
  - Upcoming scheduled events.
  - Quick links routing to deep-dive pages like the "Reporting" module.

## 3. Technical Considerations

- **Frontend Framework:** Use Angular components and structural directives (`@if`, `@for` or `*ngIf`, `*ngFor`) for conditional rendering of the Single-Farm vs Multi-Farm views.
- **State Management:** Compute the user's farm count dynamically from the loaded profile/organization state. Use this count to toggle the Middle Section's view mode.
- **Components:** Create new reusable UI components for the "Traffic Light Indicator" and "Alert Feed" to keep the Home component modular.

## 4. Acceptance Criteria
- [ ] "Compliance" and "Dashboard" links are removed from the main navigation.
- [ ] Home view displays the "Daily Action Traffic Light" component based on weather and compliance rules.
- [ ] Home view displays a feed of prioritized critical alerts.
- [ ] Single-farm users see field-level alerts directly in the middle section.
- [ ] Multi-farm users see farm-level grouped summaries in the middle section, with drill-down capability.
- [ ] Global alerts are displayed once, not duplicated per farm.
- [ ] The bottom section contains Bento-grid style widgets for inventory summaries and quick links.
