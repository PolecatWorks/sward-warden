# 0008-03 Topology and Waterway Data Specification

**State**: Complete

## Scope
This specification defines the backend processing and data structures required for topology mapping and waterway protection buffer zones (PRD 0008).

## Requirements

### Buffer Zone Calculation
- Implement spatial algorithms to calculate buffer zones around identified waterways.
- Buffer rules:
  - Chemical Fertilisers: 2m from all waterways.
  - Organic Manures/Sward: 10m from waterways, 20m from lakes (Standard).
  - Increased risk periods (e.g., specific dates or high rainfall): 15m from waterways, 30m from lakes.
- The system must generate polygonal representations of these buffer zones based on waterway linestrings/polygons and field geometries.

### Preventative Blocking (Spatial)
- During application event recording or planning, validate the application geometry against the calculated buffer zones.
- Applications intersecting buffer zones must be rejected or truncated (depending on specific UI implementation, but the backend must enforce the strict boundary).

### Vulnerable Zone Identification
- Process elevation/topology data (if available in the spatial DB) to identify slopes exceeding safe thresholds for application.
- Flag specific field areas as high-risk.

## Technical Details
- Implemented in `sw-be-container` utilizing PostGIS extensions in the PostgreSQL database.
  - **Prerequisite**: PostGIS must be installed on the PostgreSQL server (`apt-get install postgis`) and enabled in the database (`CREATE EXTENSION postgis;`).
- Use `sqlx` and spatial queries (e.g., `ST_Buffer`, `ST_Intersects`) to calculate zones and validate application areas.
- Expose endpoints to serve buffer geometries (GeoJSON format) for map rendering.
- Ensure all application logging endpoints strictly validate against these spatial constraints.
