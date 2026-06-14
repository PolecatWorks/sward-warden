# Topographical Data Integration Analysis

## 1. Overview
The goal is to fetch and store topography information (elevation, slope, and terrain features) for farms and fields within the system. This document outlines the available external API options for retrieving this data, as well as the database storage strategies for the Rust/PostgreSQL backend.

## 2. API Options for Topographical Data

Given the agricultural context of this application (including compliance with Northern Ireland regulations), accuracy and data resolution are critical factors. Fields can be relatively small, meaning low-resolution datasets may not provide enough data points for accurate slope and terrain analysis.

### Option A: Free / Open-Source APIs
**Examples:** OpenTopoData, Open-Elevation (often utilizing SRTM, Mapzen, or ASTER datasets).

*   **Pros:**
    * Completely free to use.
    * No vendor lock-in.
    * Can be self-hosted to eliminate rate limits.
*   **Cons:**
    * **Resolution:** Typically reliant on 30-meter resolution data (one data point every 30 meters). For small agricultural fields, a 30m grid might only yield a few data points, making slope calculation inaccurate.
    * **Rate Limits:** Public, hosted endpoints have strict rate limits and are not suitable for bulk synchronization of entire farms.
    * **Self-Hosting Overhead:** Hosting these datasets yourself requires downloading and managing hundreds of gigabytes of terrain datasets and managing the API infrastructure.

### Option B: Commercial APIs
**Examples:** Google Maps Elevation API, Mapbox Elevation API.

*   **Pros:**
    * **High Resolution:** Often provides 1m to 10m resolution depending on the region (UK/Ireland coverage is generally excellent). This is crucial for precision agriculture and accurate regulatory compliance regarding slopes (e.g., runoff risks near waterways).
    * **Reliability:** High availability and zero infrastructure maintenance.
    * **Features:** Often include built-in path interpolation to easily calculate slope over a distance.
*   **Cons:**
    * **Cost:** Beyond free usage tiers, API calls incur a cost. However, since farm boundaries change infrequently, this data can be fetched once and stored permanently, minimizing ongoing costs.

**Recommendation:** If the application requires precise slope calculations for regulatory validation (e.g., buffer zones, runoff risk for slurry spreading), a commercial option with higher resolution is highly recommended. The added value of accurate 1m-10m data outweighs the one-time API cost per field.

## 3. Backend Storage Strategies (PostgreSQL)

Once the data is retrieved, it must be stored in the backend database to avoid redundant API calls and enable fast querying. There are two primary approaches depending on the product's long-term requirements.

### Approach 1: Summary / Scalar Storage (Low Granularity)
This approach involves storing aggregated terrain data directly on the existing `fields` table.

*   **Implementation:** Add simple decimal/float columns to the `fields` table:
    *   `min_elevation`
    *   `max_elevation`
    *   `mean_elevation`
    *   `average_slope`
    *   `max_slope`
*   **Use Case:** Ideal if the application only needs to perform basic compliance checks (e.g., "Does this field have a slope > 10%?") or basic reporting.
*   **Storage Cost:** Extremely low.
*   **Pros:** Simple to implement, trivial to query, no complex spatial indexing required.
*   **Cons:** Cannot be used to render 3D terrain maps on the frontend, and cannot model intra-field variations (e.g., identifying a specific steep gully within an otherwise flat field).

### Approach 2: High-Density Grid / Point Cloud (High Granularity)
This approach stores the raw, detailed topographical data.

*   **Implementation:** Create a new dedicated table (e.g., `field_topography`) related to the `fields` table. Storage formats could include:
    *   A high number of rows using PostGIS `PointZ` (X, Y, Z coordinates).
    *   A single row per field utilizing a `JSONB` array or a high-density PostGIS geometry (e.g., `TIN` or `MultiPolygonZ`).
*   **Use Case:** Necessary if the roadmap includes rendering 3D field models, performing precision variable-rate slurry application, modeling localized water runoff/drainage, or conducting micro-climate analysis.
*   **Storage Cost:** High. Each field will store hundreds or thousands of data points.
*   **Pros:** Future-proof. Enables advanced agronomic features.
*   **Cons:** Requires more complex database queries, heavier payloads to the frontend, and significantly more disk space.

**Recommendation:** Start with **Approach 1 (Summary Storage)** for immediate regulatory and reporting needs. If advanced mapping or precision agriculture features are prioritized, transition to or supplement with **Approach 2** at a later stage.

## 4. UI/UX Integration

To ensure users can easily access topographical analysis for a specific farm, a "Topology View" button is provided in the "Quick Actions" section of the Farm Detail view. This navigates the user directly to the topology mapping interface for that farm.
