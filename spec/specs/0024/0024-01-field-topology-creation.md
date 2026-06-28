# Specification 0024-01: Field Topology Creation and Editing

## 1. Overview
This specification details the frontend implementation for map-based field topology (boundary) creation and editing, fulfilling PRD 0024. It leverages Leaflet and Leaflet-Geoman for an interactive map experience, allowing users to draw and modify polygons representing agricultural fields. The backend data storage in PostGIS using WKT (Well-Known Text) is already in place.

## 2. Frontend Map Component Integration

### 2.1 Dependencies
*   **Leaflet:** Core mapping library (`leaflet`, `@types/leaflet`).
*   **Leaflet-Geoman:** Plugin for drawing and editing shapes (`@geoman-io/leaflet-geoman-free`).
*   **Wicket:** Library for converting between GeoJSON/Leaflet objects and WKT (Well-Known Text) used by the backend. (Alternatively, manual string building/parsing for WKT).

### 2.2 Map Implementation Details

*   **Field View Modal:** The map component will be integrated into the Field creation modal (`FieldsComponent`) and the Field editing modal (`FieldViewComponent`).
*   **Rendering Existing Geometries:**
    *   If a field already has a `geometry_wkt`, the component will parse this WKT string and render a polygon on the Leaflet map upon initialization.
    *   The map should automatically adjust its view bounds (`fitBounds`) to encompass the rendered polygon.
*   **Drawing Controls (Leaflet-Geoman):**
    *   Enable Geoman controls specifically for drawing and editing polygons.
    *   Hide unused controls (e.g., markers, lines, circles, cutting).
    *   `pm.addControls({ position: 'topleft', drawPolygon: true, editMode: true, dragMode: false, cutPolygon: false, removalMode: true })`
*   **Data Conversion (GeoJSON <-> WKT):**
    *   When the user completes a drawing or edit (`pm:create`, `pm:update`, `pm:remove` events), extract the polygon's coordinates (LatLng arrays).
    *   Convert the LatLng array into a WKT string representation (e.g., `POLYGON((lon1 lat1, lon2 lat2, ...))`). Note: WKT uses Longitude Latitude order, while Leaflet uses Latitude Longitude.
    *   Bind this WKT string to the `geometry_wkt` property of the `Field` model before saving.

## 3. Auto-Generation Integration (Placeholder)

*   **UI Trigger:** Include a button or UI element in the map interface labeled "Auto-Detect Boundary (AI)" or similar.
*   **Click Handler:** When activated, allow the user to click a point on the map.
*   **Stub API Call:**
    *   For the initial implementation, mock the API response. When a point is clicked, generate a simple square or rough polygon around that point to simulate detection.
    *   In the future, this stub will be replaced with a real call to a service like Farmdok or Agrimetrics, passing the lat/lon of the click and receiving a GeoJSON polygon to render on the map.

## 4. UI/UX Considerations

*   **Modal Sizing:** The modals containing the map must be sufficiently large to provide a usable drawing area.
*   **Visual Style:** The drawn polygons should use a distinct color (e.g., the primary theme color with partial opacity) to stand out against satellite imagery.
*   **Base Map:** Use a satellite imagery base layer (e.g., Esri WorldImagery or similar free tile provider) by default, as it is crucial for users to see the physical terrain when drawing field boundaries.
