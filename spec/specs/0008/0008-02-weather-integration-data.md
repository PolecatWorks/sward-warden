# 0008-02 Weather Integration Data Specification

**State**: Complete

## Scope
This specification covers the backend implementation for weather data handling and safety locks as defined in PRD 0008.

## Requirements

### Static Weather Data
- Integrate a mechanism to load and serve static weather datasets (for the initial version, representing current conditions and a 48-hour forecast).
- Data should include precipitation probability, precipitation amount, temperature, and wind speed at appropriate intervals (e.g., hourly).

### Safety Lock Logic
- Implement backend validation logic that intercepts requests to schedule or log sward applications.
- **Blocking Conditions:**
  - Forecast of heavy rain (e.g., > x mm/hr or > y% probability) within the next 48 hours.
  - Current conditions indicating snow, frost, or waterlogged soil (based on proxy indicators or recent heavy rainfall data).
- When a lock condition is met, the API must return a specific error response preventing the action and providing the reason (e.g., "Application blocked: Heavy rain forecast in 24 hours").

## Technical Details
- Implemented in `sw-be-container`.
- Create a `src/weather/` module.
- For static data, utilize local files or seed a specific database table, ensuring it can be easily replaced by live API calls in the future.
- Update relevant application creation endpoints (e.g., in `src/handlers/applications.rs`) to call the weather validation service before processing the request.
- Define a structured API response format for weather timelines to be consumed by the frontend.
