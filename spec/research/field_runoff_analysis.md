# Field Runoff Analysis: Research and Recommendations

## 1. Executive Summary

This document outlines the research and technical recommendations for calculating and mapping field runoff into major waterways in Northern Ireland. The goal is to provide actionable insights on data sources, processing methodologies, and integration strategies within the existing Rust (backend) and Angular (frontend) technology stack.

## 2. Product Capabilities

Implementing this feature will enable the product to:
- **Determine Flow Paths:** Calculate the exact path rainwater takes as it runs off a specific agricultural field.
- **Identify Receiving Waterbodies:** Map these flow paths to the nearest major waterways or catchments, highlighting potential contamination risks (e.g., from fertilizer runoff).
- **Assess Runoff Potential:** Calculate flow accumulation metrics to identify areas within a field most susceptible to erosion or high volume runoff.
- **Support Compliance:** Aid in ensuring compliance with Northern Ireland agricultural regulations (e.g., waterway buffer zones) by visualizing potential runoff overlaps with protected waterbodies.

## 3. Data Sources

To calculate runoff, we require high-resolution elevation data and hydrographic networks. Northern Ireland provides excellent open data for these purposes.

### 3.1 Digital Elevation Models (DEM)
- **Source:** OpenDataNI / Department of Agriculture, Environment and Rural Affairs (DAERA).
- **Dataset:** Topographic LiDAR (Light Detection and Ranging). DAERA commissioned a comprehensive LiDAR survey providing precise 3D terrain models.
- **Access:** Available via OpenDataNI and DAERA spatial dataset portals.
- **API/Cost:** Open Data, no API keys or costs required.
- **Format:** Typically provided as raster formats (GeoTIFF) or point clouds (LAS/LAZ).

### 3.2 Waterways and River Networks
- **Source:** DAERA Water Management Unit (WMU) / OpenDataNI.
- **Datasets:**
  - Northern Ireland River Segments
  - River Basin Districts
  - Water Framework Directive (WFD) monitoring sites
- **Access:** Available for download as ESRI Shapefiles or GML format from DAERA and OpenDataNI portals.
- **API/Cost:** Open Data, free to use.

## 4. Backend Implementation (Rust & PostgreSQL/PostGIS)

The core challenge is processing raster DEM data to calculate flow direction and accumulation, and then intersecting these vector paths with waterways.

### 4.1 Methodology
1. **Hydrological Conditioning:** The raw DEM must be "hydrologically corrected" by filling sinks/depressions so water can flow continuously across the digital landscape.
2. **Flow Direction (D8/D-Infinity):** Calculate the direction water will flow out of each raster cell. The D8 algorithm (8 directions) is standard, though D-Infinity offers better precision for divergent flow.
3. **Flow Accumulation:** Calculate the accumulated weight of all cells flowing into each downslope cell. High accumulation values represent stream channels or major runoff paths.
4. **Vectorization:** Convert the raster flow accumulation paths originating from a specific field polygon into vector linestrings.
5. **Intersection:** Use PostGIS to intersect these runoff vector lines with the DAERA river network vectors to identify the specific receiving waterway.

### 4.2 Technology Recommendations

While PostGIS is excellent for vector operations (like step 5), pure PostgreSQL/PostGIS is generally inefficient for complex iterative raster processing (steps 1-3). We have two primary options:

#### Option A: WhiteboxTools (Recommended)
WhiteboxTools is an advanced geospatial data analysis engine developed by the University of Guelph.
- **Language:** It is written entirely in **Rust**.
- **Integration:** Since our backend is Rust, we can integrate WhiteboxTools directly into our application natively, or run it as a highly efficient background process via the command line.
- **Capabilities:** It has dedicated, highly optimized tools for DEM hydrological analysis (Sink Filling, D8 Flow Direction, Flow Accumulation, Watershed Delineation).
- **Workflow:**
  1. Rust backend fetches DEM raster for the bounding box of the field.
  2. Rust calls WhiteboxTools (via direct integration or shell) to generate a flow accumulation raster.
  3. Rust vectorizes the paths exceeding a threshold.
  4. Rust uses `sqlx` to query PostGIS: `SELECT river_name FROM waterways WHERE ST_Intersects(river_geom, $1)`.

#### Option B: GDAL / GRASS GIS (Alternative)
- Use standard C/C++ libraries like GDAL or GRASS GIS via Rust bindings.
- **Pros:** Industry standard, extremely robust.
- **Cons:** Complex to compile, heavy dependencies, and managing C-bindings in Rust can lead to memory safety issues or build complications in CI/CD environments.

### 4.3 Testability
- **Unit Tests:** Can be written in Rust by providing small, synthetic DEM matrices to the flow algorithms and asserting the resulting flow direction arrays.
- **Integration Tests:** Can use a small, static GeoTIFF sample of a known field and river in PostGIS, running the full pipeline and verifying the output river matches the expected result.

## 5. Frontend Visualization (Angular)

Once the backend calculates the runoff paths, the Angular frontend needs to display:
1. The field boundary.
2. The runoff path lines (gradient colored by accumulation/intensity).
3. The intersected waterway.

### 5.1 Libraries
- **MapLibre GL JS / Mapbox GL JS:** If the application currently uses MapLibre or Mapbox, we can feed the backend's vector output (GeoJSON) directly into a new MapLibre source/layer. This offers high performance for rendering complex lines.
- **Leaflet:** If the application uses Leaflet (via `@asymmetrik/ngx-leaflet`), GeoJSON can easily be added as a vector layer.
- **Data Format:** The Rust backend should expose a REST or GraphQL endpoint that returns standard GeoJSON (`FeatureCollection` of `LineString` for runoff paths, and `Polygon` for the waterway).

## 6. Next Steps
1. **Data Acquisition Spike:** Download a sample LiDAR DEM from OpenDataNI for a specific test farm.
2. **Algorithm Prototype:** Create an isolated Rust script using `whitebox-tools` to prove we can generate a flow accumulation raster from the sample DEM.
3. **Database Setup:** Load the DAERA River Segments shapefile into the local PostGIS database.
