# Specification 0008-08: Field Polygon Creation and Map View Journey

## 1. Overview
This specification details the implementation of an end-to-end integration test (Robot Framework) validating the creation of a field with a 4-corner polygon boundary located in the Ballycastle area of Northern Ireland. It verifies that the UI successfully captures the drawn spatial boundaries, saves them to the backend database, and displays the field's boundary clearly on the map when viewed.

Status: Open

## 2. Test Journey Steps (`integration-tests/tests/test_field_polygon.robot`)

The robot test must perform the following actions:
1.  **Setup**:
    *   Create a clean browser context with video recording enabled.
    *   Login as the default Demo User.
    *   Go to the Fields page (`/fields`).
2.  **Initiate Field Creation**:
    *   Click the "Add Field" button.
3.  **Define Location in Ballycastle**:
    *   Input "Ballycastle, Northern Ireland" in the map's search control input field (`input[placeholder="Enter address or location"]`).
    *   Press `Enter` to search and center the map on Ballycastle.
    *   Sleep/wait briefly for the map transition/zoom to complete.
4.  **Draw the 4-Corner Boundary**:
    *   Click the Leaflet-Geoman polygon draw tool button (e.g. `.leaflet-pm-icon-polygon`).
    *   Simulate drawing a 4-corner polygon by performing 4 clicks on the map container (or map canvas `#mapElement`), offsetting the clicks to define a small field shape.
    *   Perform a click near the first point (or double-click) to complete and close the polygon.
5.  **Enter Field Metadata & Save**:
    *   Enter the field name (e.g., "Ballycastle Meadow E2E") and area (e.g., "10.0").
    *   Click "Save Field".
    *   Verify that the field is successfully created and appears in the list.
6.  **Verify Map Boundary on View**:
    *   Click the newly created field card to navigate to the Field Details view.
    *   Verify that the map in the Field Details view renders the polygon clearly (e.g., checks that the Leaflet map has a SVG path element representing the boundary or checks the geometry exists on the map).
7.  **Cleanup**:
    *   Delete the created field via the Field Details page to restore the state.
