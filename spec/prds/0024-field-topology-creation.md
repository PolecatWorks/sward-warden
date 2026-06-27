# PRD 0024: Field Topology Creation and Editing

## 1. Overview
This document defines the requirements for adding, generating, and editing the topographical boundaries (topology) of agricultural fields within the application. The goal is to provide users with an intuitive, map-based interface to define the physical boundaries of their fields, enabling accurate acreage calculation, spatial planning, and compliance monitoring.

## 2. Key Features

### 2.1 Map-Based Field Generation (Click-to-Generate)
Users must be able to automatically generate a field boundary by selecting a point on an interactive map.

*   **Primary Approach (AI/Satellite Detection):**
    *   When a user clicks a point on the map, the application will send the coordinates to a third-party AI/Satellite imagery API (e.g., Farmdok, Agrimetrics).
    *   The API will detect the visual boundaries of the field using recent satellite imagery (e.g., Sentinel-2) and return a GeoJSON polygon.
    *   This provides a fast, frictionless experience without requiring prior setup or government identifiers.
*   **Secondary Approach (Official Government Data):**
    *   As a fallback or for strict compliance needs, the system will support fetching official subsidized boundaries via Government APIs (e.g., UK RPA Land Parcels API or DAERA Open Data).
    *   This approach will require the user to provide and authenticate their Single Business Identifier (SBI).
    *   The UI should seamlessly handle the transition or choice between these two methods.

### 2.2 Manual Creation and Editing
To account for AI detection errors or users who prefer manual input, the system must provide robust drawing and editing tools.

*   **Drawing Mode:** Users can activate a drawing tool to manually click points on the map, constructing a custom polygon representing the field boundary.
*   **Edit Mode:** When a boundary is auto-generated or previously saved, the system will render the polygon with draggable vertices (handles). Users can drag these handles to fine-tune the shape, add new points, or delete existing points to match the exact field layout.
*   **Snapping:** (Optional but recommended) The drawing tool should optionally snap to visible features or adjacent field boundaries to prevent overlaps and gaps.

### 2.3 Saving and Viewing
*   **Save Action:** Once the user is satisfied with the boundary (either auto-generated, manually drawn, or edited), clicking "Save" will transmit the boundary data to the backend.
*   **View Mode:** When navigating to a specific field's detail page, the map will center on the saved boundary, rendering it as a clear, highlighted overlay.
*   **Data Format:** The frontend will communicate spatial data with the backend using the standard GeoJSON format.

## 3. Backend and Storage Requirements
To support accurate spatial operations and future topographical analysis, the backend architecture must utilize robust geospatial technologies.

*   **Database (PostgreSQL + PostGIS):**
    *   The PostgreSQL database must have the PostGIS extension enabled.
    *   Field boundaries will be stored using the `GEOGRAPHY(Polygon, 4326)` data type. This allows for accurate, earth-surface calculations (in meters) for metrics like exact acreage, perimeter, and distance to waterways.
*   **Rust Backend Integration:**
    *   The backend (in `sw-be-container`) will use `sqlx` in combination with geospatial crates (e.g., `geozero`, `geo`, or `geo-types`) to interface with PostGIS columns.
    *   The backend will expose RESTful endpoints to accept GeoJSON from the frontend, convert it to PostGIS geography types for storage, and retrieve stored geography types, converting them back to GeoJSON for frontend rendering.

## 4. UI/UX Requirements
*   **Interactive Map Component:** Utilize a high-performance mapping library (e.g., Leaflet or a Google Maps integration) styled to match the premium "FieldMetric" aesthetic of the application.
*   **Clear Visual Feedback:** Polygons should be styled distinctly (e.g., translucent fill with a solid, high-contrast stroke) to clearly differentiate the active field from surrounding terrain and other fields.
*   **Intuitive Controls:** Drawing and editing controls (e.g., Add Point, Drag Point, Delete Point, Undo, Save) must be clear, accessible, and responsive.

## 5. Future Considerations
*   **Topographical Data Analysis:** Once field boundaries are established, the system can leverage these polygons to fetch high-resolution elevation and slope data (as outlined in PRD 0021) to power the Optimization Engine and Waterway Protection features (PRD 0008).