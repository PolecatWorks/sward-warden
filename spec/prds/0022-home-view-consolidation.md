# PRD 0022: Consolidating Dashboard and Compliance into the Home View

## Status
Proposed

## 1. Introduction
The objective of this project is to streamline the Sward Warden user interface by consolidating the currently fragmented views ("Home", "Compliance and Dashboard", and "Reporting") into a single, highly actionable, and context-aware "Home" view. The new Home view will serve as a central hub where critical tasks, compliance alerts, and actionable intelligence are immediately visible, eliminating the need for users to hunt for information across different navigation items.

## 2. Goals & Objectives
*   **Centralize Actionable Information:** Bring all immediate, actionable alerts (e.g., weather conditions, regulatory compliance limits) front and center.
*   **Reduce Navigation Overhead:** Consolidate multiple dashboards (Home, Dashboard, Compliance) into a single, unified view.
*   **Improve Situational Awareness:** Provide a clear "Traffic Light" indicator (or similar clear visual cue) for daily activities (e.g., "Good to spread" vs "Do not spread").
*   **Context-Aware Display:** Tailor alerts based on the user's farm count. For single-farm users, show field-level alerts directly. For multi-farm users, aggregate alerts at the farm level, with drill-down capabilities.

## 3. Proposed Options for View Consolidation

### Option A: The "Unified Command Center" (Recommended)
This approach completely merges Home, Compliance, and Dashboard into a single view.

*   **Top Section (Immediate Actions):**
    *   **Daily Action Traffic Light:** A prominent visual indicator (Green/Yellow/Red) immediately communicating if it is safe/legal to spread slurry or take major actions today, based on:
        *   Current weather & rainfall.
        *   Northern Ireland compliance rules (e.g., closed spreading periods).
    *   **Critical Alerts Feed:** A prioritized list of immediate actions required or warnings (e.g., "Field A requires a buffer zone due to recent rainfall", "Approaching nitrogen limit on Farm X").
*   **Middle Section (Contextual Context - Single vs Multi-Farm):**
    *   *Single-Farm Users:* Displays a consolidated list of critical field-level issues and upcoming tasks. Bypasses the farm summary entirely.
    *   *Multi-Farm Users:* Displays a summary of critical issues grouped by farm (e.g., "Farm Alpha: 2 Compliance Warnings", "Farm Beta: All Clear"). Clicking a farm drills down into the specific field issues.
*   **Bottom Section (Quick Links & Summaries):**
    *   Bento-grid style widgets summarizing inventory, upcoming scheduled events, and quick links to deep-dive pages like Reporting.
*   **Navigation Changes:** Remove "Compliance" and "Dashboard" from the main navigation menu. "Reporting" remains as a distinct module for historical data and exports.

### Option B: The "Dashboard-First Home" with Dedicated Compliance Tab
This approach merges the current "Home" and "Dashboard" into a new Home view, but retains a separate, simplified "Compliance" view for detailed regulatory audits.

*   **New Home View:** Focuses heavily on the daily operations and actionable insights.
    *   Includes the Daily Action Traffic Light and weather integrations.
    *   Shows field-specific alerts (for single-farm users) or farm summaries (for multi-farm users).
*   **Compliance View:** Transformed from a daily dashboard into an "Audit and Checklist" view. It houses detailed regulatory tracking, long-term compliance status, and document generation, rather than daily alerts.
*   **Navigation Changes:** The main menu becomes Home, Fields, Farms (if multi-farm), Compliance (Audit focused), Inventory, Reporting.

### Option C: The "Smart Widget" Approach (Customizable Home)
This approach keeps the current underlying data structures but changes the Home view to a customizable widget board.

*   **Home View:** Users can pin specific widgets to their Home screen.
*   **Default Layout:** By default, it pins the "Daily Compliance Traffic Light", "Weather Forecast", and "Critical Field Alerts".
*   **Navigation Changes:** The existing views (Compliance, Dashboard, Reporting) remain in the menu, but act as deep-dive pages where the detailed widgets reside. The Home page acts purely as an aggregated surface.

## 4. Single-Farm vs Multi-Farm Optimizations (Applies to all options)
*   **Single-Farm Users:** The Home view must bypass any farm-level aggregation. Alerts and actionable items must reference specific fields directly (e.g., "Field 12 needs spreading").
*   **Multi-Farm Users:** If an alert applies to only one farm, it should be displayed as a farm-level alert (e.g., "Farm A: Spreading prohibited today"). If it applies globally across all their farms (e.g., a national closed spreading period), it is displayed once as a global alert.

## 5. Next Steps
1.  Review and select the preferred Option (A, B, or C).
2.  Update the existing PRDs (0002-fe.md, 0016-fields-first-ux.md) to reflect the chosen consolidation strategy.
3.  Design the "Daily Action Traffic Light" component and its underlying logic requirements.
