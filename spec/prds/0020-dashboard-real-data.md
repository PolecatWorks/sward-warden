# PRD 0020: Dashboard Real Data Integration

## Overview
This document outlines the approach for transitioning the `SlurryDashboardComponent` from hardcoded visual placeholders to representing real agricultural data. The dashboard will utilize local-first data provided by the `FarmManagementService` to provide farmers with an accurate overview of their sward and slurry management.

## 1. Farm Context and Filtering
- **Requirement**: The dashboard must support a "Global View" (aggregating data across all farms owned by the user) and a "Per-Farm View" (filtering data to a specific farm).
- **Approach**:
  - Fetch user farms via `FarmManagementService.getFarms()`.
  - Introduce a reactive state (e.g., `selectedFarmId$`) that defaults to `null` (global view) and updates when the user selects a specific farm via a UI toggle or dropdown.
  - All subsequent data streams must use RxJS operators (like `switchMap` and `combineLatest`) to re-calculate metrics whenever the selected farm context changes.

## 2. Live Storage Capacity
- **Current State**: Hardcoded to 65% with a static SVG gauge.
- **Data Mapping**:
  - **Total Capacity**: Sum the `manure_storage_capacity` from `FarmRecord` entries for the relevant farm(s) for the current year.
  - **Current Volume**: Since live telemetry isn't actively tracked in the backend tables, "Current Volume" can be estimated by calculating: `(Baseline Inventory + Inward SwardMovements) - (Applied Volume from OrganicManureApplications + Outward SwardMovements)`.
  - Alternatively, if total volume tracking is not fully possible, derive a percentage based on recent application activity versus capacity.
- **Visual Integration**: Calculate the percentage, and dynamically bind `storageLevel` to the SVG `<circle>` `stroke-dashoffset` attribute to adjust the gauge fill. Include actual cubic meter (`m³`) figures if calculable.

## 3. Nutrient Profile
- **Current State**: Hardcoded Nitrogen, Phosphorus, and Potassium progress bars.
- **Data Mapping**:
  - Fetch recent `OrganicManureApplication` records.
  - Calculate the average `nitrogen_content_kg_per_unit` for recent applications to power the Nitrogen (N) visual.
  - For Phosphorus (P) and Potassium (K), if direct field values are missing in the application entity, utilize average values from `SoilAnalysis` records associated with the farm's fields, or apply standard nutrient ratios based on the `manure_type` (e.g., Cattle Slurry vs. Pig Slurry).
- **Visual Integration**: Bind the calculated values and compute a percentage relative to optimal benchmark thresholds to dynamically set the `width` styles of the HTML progress bars.

## 4. 6-Month Trend Chart
- **Current State**: A static SVG faux-line chart.
- **Data Mapping**:
  - Retrieve `Event` records (filtered by `event_type` containing "slurry" or "organic manure") joined with `OrganicManureApplication` to access applied volume (`volume_applied_m3_per_ha` multiplied by field area).
  - Group and aggregate total applied volume by month over the past 6 months.
- **Visual Integration**:
  - Either programmatically generate the `d` attribute of the SVG `<path>` based on the scaled monthly data points, OR
  - Replace the faux SVG with a lightweight, accessible charting library configuration (e.g., Chart.js) fed by the aggregated monthly data. Update the x-axis labels to dynamically render the names of the last 6 months.

## 5. Application Events (Compact Alerts)
- **Current State**: Hardcoded array of 3 events.
- **Data Mapping**:
  - Query all `Event` records linked to the selected farm(s)' fields.
  - Filter for relevant event types (slurry/manure).
  - Classify events with a `date` in the future as "Planned", and those with a `date` in the past as "Historical".
  - Sort chronologically by date descending (or closest to today) and take the top 5 records.
- **Visual Integration**: Map the resulting data to the existing `events` array structure and render via the Angular `*ngFor` loop in the template.

## 6. Dynamic Text and Imagery
- **Current State**: Hardcoded site location text ("East-Ridge Valley Complex").
- **Data Mapping**:
  - Use the `name` attribute of the currently selected `Farm`. If viewing globally, default to "All Farms".
- **Visual Integration**: Interpolate `{{ selectedFarm?.name || 'All Farms Overview' }}` into the Site Location header block in the image overlay cell.

## Implementation Guidelines
- **Reactive UI**: Expose the calculated dashboard data as Observables (e.g., `dashboardData$`) in the component typescript and consume them in the template using the `async` pipe.
- **Performance**: Use RxJS `shareReplay(1)` for the base data streams (farms, fields, events, records) to prevent multiple identical queries to the local RxDB database during template rendering.
