# PRD 0008: Spatial Data, Mapping & Optimization

## Overview
This document defines the requirements for the application's spatial capabilities, including field topology creation, topographical data analysis, mapping visualizations, weather integration, and the intelligent optimization engine. It consolidates PRDs 0008, 0021, 0024, and 0029 into a unified spatial strategy.

## 1. Field Topology Creation and Editing
- **Map-Based Generation:** Users can define field boundaries via an interactive map interface using GeoJSON polygons (`GEOGRAPHY(Polygon, 4326)` in PostGIS).
- **Auto-Generation:**
  - *Primary:* AI/Satellite imagery API (e.g., Farmdok) detects boundaries via click.
  - *Secondary:* Fetch official boundaries via Government APIs (e.g., UK RPA) using a Single Business Identifier (SBI).
- **Manual Tools:** Users can manually draw, edit vertices (drag handles), snap to adjacent boundaries, and delete points.
- **Undefined Boundaries:** If a boundary is unknown, a single point representing the field center is permitted until defined. This single point representation has no relationship to the field's area, and all fields must have a defined area regardless of whether their boundary is a point or polygon.
- **Viewing Modes:**
  - *Field View:* Active field colored distinctly, farm bounds centered.
  - *Farm View:* Shows the extent of all fields in the farm with a suitable buffer context (e.g. 1 km). These bounds must be recorded on the farm definition object and persisted, updating dynamically as fields are added/removed or as farm geometry is modified.

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
- **Strategic Planning:** Identify the best fields for application to maximize nutrient uptake and minimize runoff risk.
- **Weather Integration:**
  - Incorporate live/forecast weather data (initially static datasets, transitioning to APIs).
  - Automatically prevent scheduling/logging applications if heavy rain is forecast within 48 hours or if current conditions prohibit spreading.

## 5. UI/UX Mapping Visualizations
- **Topology View Access:** A "Topology View" button must be provided in the Farm Detail view's Quick Actions section, navigating directly to the topology mapping interface for that farm.
- **Integrated Map View:** Premium, high-contrast map interface. Polygons clearly styled with translucent fill and high-contrast strokes.
- **Topology Toggles:** Users can toggle layers like Soil Type, Risk Level, and Historical Application. High-risk slopes and vulnerable zones are visually flagged.
- **Optimization Bento:** Suggested plans presented in Bento-style dashboards explaining the "Reasoning" (e.g., "Optimal Weather Window").
- **Weather Timeline:** Specialized horizontal timeline displaying the "Safe Spreading Window".
