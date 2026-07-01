# Specification 0008-07: GeoJSON Geometry Transition

## 1. Overview
This specification details the transition from Well-Known Text (WKT) string fields to GeoJSON string fields for representational geometry of field boundaries. This updates PRD 0003 and PRD 0008, eliminating the contradiction.

## 2. Backend Changes (`sw-be-container`)

### 2.1 Models (`src/models.rs`)
*   Replace `geometry_wkt: Option<String>` with `geometry_geojson: Option<String>` on the `Field` struct, `ChemicalFertiliserApplication` struct, and `OrganicManureApplication` struct. Add appropriate deserialization mappings if required.

### 2.2 Fields API Handler (`src/webserver/fields.rs`)
*   Change select queries for fields to select geometry as GeoJSON: `ST_AsGeoJSON(geom) as geometry_geojson`.
*   Change INSERT and UPDATE queries to parse GeoJSON into the `geom` column using `ST_SetSRID(ST_GeomFromGeoJSON($10), 4326)`.

### 2.3 Synchronization Handler (`src/webserver/sync.rs`)
*   Update database selection queries to fetch `ST_AsGeoJSON(f.geom) as geometry_geojson`.

## 3. Frontend Changes (`sw-fe-container`)

### 3.1 Data Model (`src/app/models/field.ts`)
*   Change type definition of `Field` to use `geometry_geojson?: string;` instead of `geometry_wkt?: string;`.

### 3.2 RxDB Schema (`src/app/services/rxdb/schemas.ts`)
*   Update the schema property name from `geometry_wkt` to `geometry_geojson`.

### 3.3 Sync Engine (`src/app/services/sync-engine.service.ts`)
*   Update the synchronization payload mapping to read/write `geometry_geojson`.

### 3.4 Components & Forms
*   Update the Field drawing component (`app-field-map-editor`) to bind directly to a GeoJSON string. Avoid converting Leaflet polygons to WKT.
*   Update `FieldsComponent` and `FieldViewComponent` to hold `editFieldGeometry_geojson` instead of `editFieldGeometry_wkt`.
*   Update templates (`fields.component.html`, `field-view.component.html`) to display and manage the GeoJSON property appropriately.
