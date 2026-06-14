# Technical Specification: Topographical Data Integration

**State**: Open

## 1. Overview
This specification details the implementation of topographical data fetching and storage for agricultural fields. Relying on high-resolution commercial APIs (e.g., Google Maps Elevation API or Mapbox Elevation API), the application will retrieve elevation profiles, compute terrain slope metrics, and persist the summarized scalar values directly on the `fields` table to enable regulatory compliance checks (e.g., runoff risks near waterways).

## 2. Proposed Changes

### Database Migration (`sw-be-container/migrations`)
- Create a new migration file adding the following columns to the `fields` table:
  - `min_elevation` (double precision, nullable)
  - `max_elevation` (double precision, nullable)
  - `mean_elevation` (double precision, nullable)
  - `average_slope` (double precision, nullable)
  - `max_slope` (double precision, nullable)

### Backend Services (`sw-be-container`)
- **API Client**:
  - Implement a client for a commercial elevation service (such as Google Maps or Mapbox Elevation API) using the `reqwest` HTTP client.
  - Allow configuring the API key and service base URL via environment variables and backend configurations (`config/default.yaml`).
- **Processing Logic**:
  - Create a service to fetch elevation points for a field's polygon boundary.
  - Calculate slope statistics (average and maximum slope) based on the fetched elevation points and spatial distances.
  - Automatically trigger the topographical data fetch and computation when a field is created or when its boundary is modified.
- **REST API / Models**:
  - Update field database models and REST API response payloads to expose the new topographical columns.

### Frontend (`sw-fe-container`)
- **Models / Services**:
  - Update the Angular field interface/model to include the new topographical fields.
- **UI Components**:
  - Display elevation range (min, max, mean) and slope metrics on the Field detail cards/views.
  - Highlight fields with steep slopes that exceed regulatory limits for spreading.

## 3. Testing & Verification

- **Unit Tests**:
  - Mock external elevation API requests using `wiremock` or mock traits to verify resilient handling of API rate limits, timeouts, and failures.
  - Unit test the calculation formulas for slope and elevation summaries (min, max, mean) given mock coordinate inputs.
- **Integration Tests**:
  - Verify database migrations run successfully and table definitions match models.
  - Add tests validating that fields retrieve correct topographical stats upon database insertion.
