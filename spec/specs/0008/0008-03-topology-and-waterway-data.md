# 0008-03 Topology and Waterway Data Specification

**State**: Complete

## Scope
This specification defines the be processing and data structures required for topology mapping and waterway protection buffer zones (PRD 0008).

## Requirements

### Buffer Zone Calculation
- Implement spatial algorithms to calculate buffer zones around identified waterways.
- Buffer rules:
  - Chemical Fertilisers: 2m from all waterways.
  - Organic Manures/Sward: 10m from waterways, 20m from lakes (Standard).
  - Increased risk periods (e.g., specific dates or high rainfall): 15m from waterways, 30m from lakes.
- The system must generate polygonal representations of these buffer zones based on waterway linestrings/polygons and field geometries.

### Preventative Blocking and Spatial Truncation
- During application event recording or planning, validate the application geometry against the calculated buffer zones.
- **Truncation Algorithm**:
  - If a planned spreading area intersects a buffer zone, the backend must not reject the request outright. Instead, it must execute a PostGIS geometry subtraction query (`ST_Difference(field_geometry, buffer_geometry)`).
  - The API will update the application record with this truncated spreading polygon, recalculate the effective spreading area (in hectares), and return the modified geometry in the response payload.
- This ensures that operators can automatically plan applications to the maximum safe boundary without violating regulations.

### Interactive Map Layers & Data Schema
- The spatial database must support the following raster/vector layers:
  - **Soil Type Layer**: Maps soil classification polygons (e.g. Clay, Sandy, Loam).
  - **Risk Level Layer**: Compiles sloped regions (> 15% gradient) and areas adjacent to waterways as high, medium, or low risk.
  - **Historical Application Layer**: Tracks cumulative nitrogen and phosphorus loading records per field over a rolling 12-month period.
- Data schema fields for fields mapping:
  - Table `field_topology_attributes`: `field_id` (UUID), `average_slope` (NUMERIC), `soil_type` (VARCHAR), `vulnerable_zone_status` (BOOLEAN).


## Technical Details
- Implemented in `sw-be-container` utilizing PostGIS extensions in the PostgreSQL database.
  - **Prerequisite**: PostGIS must be installed on the PostgreSQL server (`apt-get install postgis`) and enabled in the database (`CREATE EXTENSION postgis;`).
- Use `sqlx` and spatial queries (e.g., `ST_Buffer`, `ST_Intersects`) to calculate zones and validate application areas.
- Expose endpoints to serve buffer geometries (GeoJSON format) for map rendering.
- Ensure all application logging endpoints strictly validate against these spatial constraints.
