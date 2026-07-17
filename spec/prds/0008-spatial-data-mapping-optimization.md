# PRD 0008: Spatial Data, Mapping & Optimization

## Overview
This document defines the requirements for the application's spatial capabilities, including field topology creation, topographical data analysis, mapping visualizations, weather integration, and the intelligent optimization engine. It consolidates PRDs 0008, 0021, 0024, and 0029 into a unified spatial strategy.

## 1. Field Topology Creation and Editing
- **Map-Based Generation:** Users can define field boundaries via an interactive map interface using GeoJSON polygons or points (`GEOMETRY(Geometry, 4326)` in PostGIS).
- **Auto-Generation:**
  - *Primary:* AI/Satellite imagery API (e.g., Farmdok) detects boundaries via click.
  - *Secondary:* Fetch official boundaries via Government APIs (e.g., UK RPA).
    - The backend provides a `POST /v0/spatial/official-boundary` endpoint that accepts a point (latitude and longitude).
    - The endpoint checks a local cached database table (`official_field_boundaries`) using PostGIS spatial intersection.
    - If a cached boundary isn't found, it fetches the official polygon, Single Business Identifier (SBI), and parcel ID from a configurable external government API URL, caches it locally, and returns the result to the UI so that the UI can assign it.
- **Manual Tools:** Users can manually draw, edit vertices (drag handles), snap to adjacent boundaries, and delete points.
- **Undefined Boundaries:** If a boundary is unknown, a single point representing the field center is permitted until defined. This single point representation has no relationship to the field's area, and all fields must have a defined area regardless of whether their boundary is a point or polygon.
- **Viewing Modes:**
  - *Field View:* Active field colored distinctly, farm bounds centered.
  - *Farm View:* Shows the extent of all fields in the farm with a suitable buffer context (e.g. 1 km). These bounds must be recorded on the farm definition object and persisted, updating dynamically as fields are added/removed or as farm geometry is modified.
- **Area Calculation:** The system provides a backend spatial calculation endpoint that allows users to automatically suggest and populate the field area (in hectares) based on the current polygon's calculated square meters.

## 2. Topographical Data Analysis
Evaluating the slope and elevation of a field is critical for determining runoff risk and ensuring compliance.
- **Runoff Pathway Analysis:** To assess contamination risks, the system evaluates where surface water flows off a field. It traces downslope flowpaths from fields and maps these paths against regional waterway networks (e.g., DAERA river segments) to identify the specific receiving waterbodies that a field contributes to.
- **Data Acquisition (DEM):** Transitioning away from commercial point-sampling APIs, the system utilizes high-resolution LiDAR Digital Elevation Models (DEMs), such as the DAERA Topographic LiDAR dataset.
- **WhiteboxTools Processing:** The backend invokes WhiteboxTools (written in Rust) to perform high-density raster processing on the local DEM tile cropped to the field's bounding box.
- **Metric Aggregation (Summary Storage):** The cell-level data is aggregated and stored as scalar values on the `fields` table to ensure rapid querying without massive storage overhead:
  - `min_elevation`, `max_elevation`, `mean_elevation`
  - `average_slope`, `max_slope`

## 3. Waterway Protection & Buffer Zones
- **Buffer Zone Enforcement:** The system automatically calculates and visualizes mandatory buffer zones:
  - *Chemical Fertilisers:* 2 meters from all waterways.
  - *Organic Manures:* Standard (10m waterways, 20m lakes) or Increased (15m waterways, 30m lakes during high-risk periods).
- **Preventative Blocking:** The system prevents logging or planning application events within these zones.

## 4. Intelligent Optimization Engine
- **Nutrient Calculation:** Suggest optimal application rates based on crop needs, soil analysis, and manure nutrient content.
  - *Technical Debt:* The nutrient calculation currently omits a check for the soil test date because `soil_test_date` is not in the `Field` model. Future implementation requires adding this field to the database schema (`fields` table), the `Field` model in the backend, and updating the frontend forms to include it.
- **Strategic Planning:** Identify the best fields for application to maximize nutrient uptake and minimize runoff risk.
- **Weather Integration:**
  - Incorporate live/forecast weather data (initially static datasets, transitioning to APIs).
  - Automatically prevent scheduling/logging applications if heavy rain is forecast within 48 hours or if current conditions prohibit spreading.

## 5. UI/UX Mapping Visualizations
- **Topology View Access:** A "Topology View" button must be provided in the Farm Detail view's Quick Actions section, navigating directly to the topology mapping interface for that farm.
- **Topology View Navigation:** A back button must be provided on the Topology Map view to allow users to navigate back to the Farm Detail view.
- **Integrated Map View:** Premium, high-contrast map interface. Polygons clearly styled with translucent fill and high-contrast strokes.
- **Topology Toggles:** Users can toggle layers like Soil Type, Risk Level, and Historical Application. High-risk slopes and vulnerable zones are visually flagged.
- **Optimization Bento:** Suggested plans presented in Bento-style dashboards explaining the "Reasoning" (e.g., "Optimal Weather Window").
- **Weather Timeline:** Specialized horizontal timeline displaying the "Safe Spreading Window".

## 6. User Journeys
The following user journeys validate spatial mapping capabilities:

- **Field Topology Creation Journey (`test_field_topology.robot` and `test_field_topology_flow.robot`)**: The integration testing suite must include a spatial data mapping journey testing both API functionality and the UI frontend interface. The journey must verify creating fields with various topologies: one containing a Polygon GeoJSON geometry, one with a Point GeoJSON geometry, and one with no geometry (null). It must ensure that the map tools accurately create and verify these locations correctly on the backend API and visualise them on the UI.
- **Field Polygon Creation and Map View Journey (`test_field_polygon.robot`)**: The integration testing suite must include an end-to-end field creation and map verification journey. The journey must use the UI to initiate the creation of a new field. The user must define the field boundary by inputting or drawing four corner coordinates located in the Ballycastle area of Northern Ireland (defining a polygon location). The UI must successfully capture this spatial layout and create the field. After the field is successfully created, the user must navigate to the field's detail or map view and verify that the field boundary is clearly displayed and highlighted on the map according to the four corners defined during creation.
