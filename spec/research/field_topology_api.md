# Field Topology API Research

## Overview
This document outlines research into available APIs and open datasets for obtaining agricultural field boundaries (topology), with a specific focus on Northern Ireland (DAERA) and the wider UK (RPA).

## UK Rural Payments Agency (RPA) - Land Parcels API
The RPA offers a public Web Feature Service (WFS) REST API for fetching agricultural land parcels and boundaries within the UK.

### Features
* **Endpoints:** Exposes WFS endpoints for `LandParcels`, `LandCovers`, and `HedgeControl`.
* **Data Fields:** Contains spatial boundaries (`SHAPE_AREA`, `SHAPE_PERIMETER`), identifiers (`SBI`, `PARCEL_ID`), and land cover metadata.
* **Authentication/Requirements:** Requires a valid Single Business Identifier (SBI). The API accepts standard WFS queries.
* **Format:** Returns spatial data (e.g., GeoJSON) using standard geospatial coordinate systems (e.g., OSGB / EPSG:27700 or EPSG:4326 via `srsname` mapping).
* **Limitations:** Bound to English/Welsh holdings covered under the RPA.

### Documentation
* API Portal: [DEFRA Data Services Platform - RPA](https://environment.data.gov.uk/rpa/api-doc/)

## Northern Ireland - DAERA Open Data
For Northern Ireland specifically, field boundary data is managed by the Department of Agriculture, Environment and Rural Affairs (DAERA).
* DAERA publishes open datasets on spatial portals like OpenDataNI and the DAERA ArcGIS Hub.
* High-resolution individual field parcel boundaries (LPIS - Land Parcel Identification System) are often restricted to the specific landowner/business for privacy and GDPR reasons, similar to the RPA.
* To access specific DAERA field boundaries programmatically, agricultural software providers generally require explicit farmer authorization (e.g., linking a DAERA business ID) or utilize third-party aggregators.

## Third-Party Aggregators (Global/European)
Several agricultural API providers offer field boundary detection based on satellite imagery (Sentinel-2) or aggregated regional data:
* **Agrimetrics:** Offers a Field Boundaries API covering the UK.
* **Farmdok / Field Boundary API:** Uses AI on Sentinel-2 imagery to automatically detect and return GeoJSON boundaries for fields globally. Useful if official government APIs are not accessible for specific Northern Irish farms.

## Recommendations
1. If the platform holds an integration with DAERA/RPA allowing users to input their SBI (Single Business Identifier), the RPA WFS API (and corresponding DAERA portals if authenticated) is the most accurate source of truth for subsidized field boundaries.
2. If real-time or SBI-independent boundary data is needed, relying on third-party AI-based satellite APIs (like Agrimetrics or Farmdok) is the fallback approach.