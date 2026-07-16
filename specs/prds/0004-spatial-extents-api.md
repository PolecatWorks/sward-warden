# Product Requirements Document (PRD): Spatial Extents API

## 1. Overview
This feature introduces a new backend API endpoint designed to calculate the bounding box extents and the center point of a given set of geometries (e.g., polygons and points). This allows frontend clients to dynamically determine map extents to frame a collection of geometries (such as all fields in a farm) on the fly, without needing to persist or pre-calculate this metadata in the backend database.

## 2. Requirements

*   **API Endpoint:** A new `POST /v0/spatial/extents` endpoint must be exposed on the Rust backend.
*   **Input Data:** The API must accept an array of fully typed GeoJSON geometries (e.g., Polygons, Points) in pure JSON format to prevent double-escaping issues.
*   **Core Computations:**
    *   The backend must calculate the overall bounding box (minimum and maximum X and Y coordinates) covering all provided geometries.
    *   The backend must calculate a "center" point derived from the center of the computed bounding box (`(min + max) / 2`).
*   **Output Data:** The API must return the computed `center` point (x, y) and `extents` (min_x, max_x, min_y, max_y).
*   **No Persistence:** Computations must happen strictly in-memory during the request lifecycle. The results must not be stored in the database.
*   **Error Handling:** The API must return an appropriate error (e.g., HTTP 400 Bad Request) if an empty list of geometries or unparseable geometries are provided.

## 3. User Journey
The user (or frontend client on behalf of the user) submits a list of GeoJSON geometries representing farm fields to the backend via the extents API. The backend quickly calculates the bounding box and center point in-memory and returns the coordinates. The frontend uses these returned coordinates to set the map's viewport, successfully framing all the provided fields on the screen simultaneously.
