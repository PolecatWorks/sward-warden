# 0008-04 Optimization & Mapping UI Specification

**State**: Open

## Scope
This specification covers the comprehensive frontend implementation integrating optimization results, map visualizations, and weather timelines as per PRD 0008.

## Requirements

### Map Interface Integration
- Implement a high-contrast map view (using Mapbox, Leaflet, or similar, styled to match FieldMetric guidelines).
- **Layers:**
  - Base field boundaries.
  - Topology/Elevation visualization (e.g., contour lines or gradient shading).
  - High-risk runoff zones (visually distinct shading).
  - Buffer zones for waterways (marked with tonal, high-quality iconography and warning colours).
- Interactive layer toggles for the user.

### Optimization Bento Dashboard
- Create a dashboard utilizing a Bento-grid layout to display suggested application plans.
- Each suggestion should be a distinct card displaying:
  - Target Field.
  - Recommended Rate.
  - "Reasoning" tags/sub-cards (e.g., "Optimal Weather Window", "High N Requirement").

### Weather Timeline and Safety UI
- Develop a horizontal timeline component specifically showing the "Safe Spreading Window" based on the 48-hour forecast.
- Use clear visual indicators (green/red blocks or icons) to denote safe vs. unsafe periods.
- Implement strict UI-level prevention (disabling buttons, showing error modals) when the backend returns a Weather Safety Lock or Spatial Buffer violation.

## Technical Details
- Implemented in `sw-fe-container` using Angular and Tailwind CSS.
- Map components should be designed for performance, especially when rendering complex GeoJSON (buffer zones, topologies).
- Ensure the Bento layout and Map view are fully responsive across mobile, tablet, and desktop (referencing PRD 0012 guidelines).
- Integrate with backend endpoints defined in specs `0008-01`, `0008-02`, and `0008-03`.
