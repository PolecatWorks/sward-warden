<<<<<<<< HEAD:spec/prds/0029-field-slope-evaluation.md
# PRD 0029: Field Slope Evaluation using WhiteboxTools
========
# PRD 0028: Field Slope Evaluation using WhiteboxTools
>>>>>>>> 18e09fa (docs(prds): add PRD 0028 for field slope evaluation):spec/prds/0028-field-slope-evaluation.md

## 1. Overview

Evaluating the slope of an agricultural field is critical for determining runoff risk, ensuring compliance with waterway buffer zones, and optimizing agricultural operations (e.g., assessing the suitability of slurry application equipment).

This document outlines the requirements and high-level architectural approach for evaluating field slope. We will transition from using external commercial point-sampling APIs (as previously outlined in PRD 0021) to an in-house solution using **WhiteboxTools** and high-resolution Digital Elevation Models (DEMs).

## 2. Rationale for WhiteboxTools and DEMs

Using an advanced geospatial data analysis engine like WhiteboxTools (which is written in Rust, matching our backend technology) combined with free, high-resolution LiDAR DEM data (such as those provided by DAERA/OpenDataNI) offers significant advantages:

- **Precision:** LiDAR DEMs provide exceptional resolution (e.g., 1m to 2m grids), allowing for accurate detection of micro-topography and steep localized slopes that a 30m grid or sparse commercial API sample might miss.
- **Cost:** Avoids recurring API costs associated with commercial elevation providers.
- **Hydrological Extensions:** Lays the foundation for more advanced hydrological modeling (e.g., flow direction, flow accumulation, and exact waterway runoff paths) as outlined in our field runoff analysis research.
- **Performance:** WhiteboxTools is highly optimized for complex iterative raster processing, which is generally inefficient when attempted natively in PostGIS.

## 3. Core Requirements

### 3.1 Data Acquisition (DEM)

- The system must acquire and store relevant high-resolution DEM tiles covering the geographical area of the farm/field.
- For fields in Northern Ireland, the system will utilize the DAERA Topographic LiDAR dataset (available via OpenDataNI).

### 3.2 Slope Calculation

- When a field's boundary (polygon) is created or updated, the system must trigger a background process to evaluate its slope.
- The process must utilize WhiteboxTools to analyze the DEM raster data corresponding to the field's bounding box.
- The system will calculate slope for each raster cell within the field boundary.

### 3.3 Metric Aggregation and Storage

While WhiteboxTools performs the high-density grid analysis, we will maintain the "Summary Storage" strategy for the database to ensure rapid querying and low storage overhead.

The backend must aggregate the cell-level slope data and update the `fields` table with the following scalar values:

- `min_elevation` (meters)
- `max_elevation` (meters)
- `mean_elevation` (meters)
- `average_slope` (percentage or degrees)
- `max_slope` (percentage or degrees)

### 3.4 API and UI Integration

- The calculated slope metrics must be exposed via the backend API when retrieving field details.
- The UI will display these metrics (e.g., `average_slope` and `max_slope`) on the Field Details page.
- The system will use these metrics to feed into the Compliance Engine (e.g., flagging fields where `max_slope` exceeds regulatory limits for certain types of slurry spreading).

## 4. Technical Approach

1. **Raster Cropping:** The Rust backend fetches the field geometry from PostGIS and crops the relevant local DEM tile to the field's bounding box.
2. **WhiteboxTools Processing:** The backend invokes WhiteboxTools (either natively as a Rust library or via subprocess) to calculate the slope raster from the cropped DEM.
3. **Aggregation:** The backend analyzes the output slope raster, masking out cells that fall outside the exact field polygon boundary, to compute the average and maximum slope values.
4. **Persistence:** The scalar values (`average_slope`, `max_slope`, `min_elevation`, `max_elevation`, `mean_elevation`) are written back to the `fields` table.

## 5. Revisions

- **Supercedes:** This PRD updates the architectural approach originally defined in PRD 0021 (Option B: Commercial APIs), mandating the use of DEM and WhiteboxTools instead.
