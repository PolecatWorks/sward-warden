# Specification 0008-05: Topographical Data Integration

## 1. Overview
This specification details the technical approach for fetching, storing, and analyzing topographical data (elevation, slope, terrain features) for farms and fields.

## 2. External API Integration (Option B: Commercial APIs)

To ensure the high accuracy (1m - 10m resolution) required for regulatory compliance regarding slopes (e.g., runoff risks near waterways), the system will integrate with a commercial API for elevation data.

### 2.1 Provider Selection
- The system will abstract the elevation API provider behind a common interface, allowing integration with services like Google Maps Elevation API or Mapbox Elevation API.
- **Cost Minimization:** API calls will only be made when field boundaries are created or modified. The data will be stored permanently to minimize ongoing costs.

### 2.2 Data Fetching Strategy
- Upon creation or modification of a field's polygon (boundary), an asynchronous background task will be triggered.
- The task will calculate an appropriate grid or sample points within the field boundary based on the required resolution.
- A batch API request will be sent to the commercial elevation provider to retrieve elevation data for the calculated points.

## 3. Backend Storage Strategy (Approach 1: Summary Storage)

For immediate regulatory and reporting needs, we will implement **Approach 1 (Summary Storage)**. This provides a low-cost, high-performance solution for basic compliance checks.

### 3.1 Database Schema Updates
The `fields` table (or an equivalent associated entity) in PostgreSQL will be updated to include the following decimal/float columns:
- `min_elevation` (meters)
- `max_elevation` (meters)
- `mean_elevation` (meters)
- `average_slope` (percentage)
- `max_slope` (percentage)

### 3.2 Calculation Logic
- The background task, upon receiving the elevation grid data from the commercial API, will calculate the summary statistics.
- **Slope Calculation:** The slope between adjacent sample points will be calculated to determine the maximum and average slopes across the field.
- The calculated summary metrics will be persisted to the `fields` table.

## 4. Frontend Integration

### 4.1 Topology View
- Add a "Topology View" button in the "Quick Actions" section of the Farm Detail view.
- This button will navigate the user to a topology mapping interface for the specific farm.
- The topology interface will overlay the summary statistics (e.g., highlighting fields with a `max_slope` exceeding regulatory limits) on the map view.
