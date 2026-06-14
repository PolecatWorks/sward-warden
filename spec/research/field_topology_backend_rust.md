# Field Topology Backend Storage & Rust Integration Research

## Overview
This document explores the best practices for storing geographical field boundaries (polygons/topology) in a PostgreSQL database and how to interface with that data using Rust within the `sw-be-container` backend.

## PostgreSQL Storage Options

### 1. PostGIS (Recommended)
**PostGIS** is the industry standard spatial database extension for PostgreSQL.
* **Storage Type:** Use the `GEOMETRY(Polygon, 4326)` or `GEOGRAPHY(Polygon, 4326)` type. `GEOGRAPHY` is generally preferred for agricultural fields as it calculates areas and distances over the curvature of the earth (meters), whereas `GEOMETRY` calculates using Cartesian coordinates.
* **Advantages:** Native support for spatial queries (e.g., "Find all fields intersecting this zone", calculating exact acreage, buffer zones for water bodies).
* **Requirements:** Requires the `postgis` extension to be enabled on the PostgreSQL instance (`CREATE EXTENSION postgis;`).

### 2. JSONB (Fallback Option)
If installing PostGIS is impossible in the target database environment, boundaries can be stored as GeoJSON inside a `JSONB` column.
* **Storage Type:** `JSONB`
* **Advantages:** Requires no database extensions. Easy to serialize/deserialize directly to frontend APIs.
* **Disadvantages:** Database cannot easily perform spatial operations (like calculating overlapping areas or distance queries) without complex and slow custom functions.

## Rust Ecosystem Libraries

If choosing the recommended **PostGIS** route, the Rust backend ecosystem provides excellent tools for seamless integration:

### 1. `sqlx`
Our backend already utilizes `sqlx` (v0.8). `sqlx` has native support for PostgreSQL types.
* By enabling the `postgres` feature and utilizing the ecosystem, `sqlx` can map SQL queries directly to Rust structs.
* *Note:* `sqlx` removed native PostGIS type mapping out of the core crate in recent versions, deferring to third-party crates for standard WKB (Well-Known Binary) serialization.

### 2. `geozero`
[geozero](https://crates.io/crates/geozero) is a zero-copy library for converting geographical data formats.
* Provides the `wkb::Encode` and `wkb::Decode` wrappers for `sqlx`.
* **Usage:** You can execute queries with `sqlx` and map PostGIS `geometry`/`geography` columns directly into `geo_types` using `geozero`.
```rust
// Example using geozero and sqlx
use geozero::wkb;
use geo_types::Geometry;

let row: (wkb::Decode<Geometry<f64>>,) = sqlx::query_as(
    "SELECT geom FROM fields WHERE id = $1"
)
.bind(field_id)
.fetch_one(&pool).await?;

let polygon = row.0.geometry.unwrap();
```

### 3. `geo` and `geo-types`
[geo](https://crates.io/crates/geo) and `geo-types` provide the foundational Rust structs for spatial data (e.g., `Point`, `Polygon`, `LineString`).
* **Advantages:** Once the data is pulled from PostgreSQL via `geozero`, `geo` provides mathematical operations (like checking if a coordinate is inside a polygon or calculating the area) directly in Rust memory.

## Recommended Architecture
1. **Database:** Add the PostGIS extension to PostgreSQL. Store field boundaries in a `GEOGRAPHY(Polygon, 4326)` column.
2. **Rust Backend:**
   - Add `geo` (or `geo-types`) and `geozero` to `Cargo.toml`.
   - Ensure `geozero` is configured with the `with-postgis-sqlx` (or equivalent `sqlx` v0.8) feature.
   - Map the PostGIS columns to `geo_types::Polygon` using `geozero::wkb::Decode`.
3. **API Layer:** Convert the `geo_types::Polygon` to GeoJSON when returning the topology to the frontend, which UI libraries like Leaflet or Google Maps can natively render.