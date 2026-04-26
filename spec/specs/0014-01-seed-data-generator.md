# Specification 0014-01: Seed Data Generator

## Goal
Implement a standalone Rust CLI tool in `sw-be-container/tools/seed_data` that populates the Sward Warden database with realistic, localised mock data via the backend API.

## State: Complete

## Technical Plan
1. **Dependencies**:
   - Add `clap` for command-line arguments parsing to `sw-be-container/tools/seed_data/Cargo.toml`.
   - Add `chrono` for date handling.
   - Already configured dependencies: `reqwest`, `tokio`, `serde`, `fake`, `rand`.
2. **Models Definitions**:
   - Create local struct models in the seed data generator matching the API request and response payloads (e.g., `User`, `Farm`, `Field`, `Event`, `FarmRecord`).
3. **CLI Arguments (`clap`)**:
   - `--api-url`: The target API base URL (default: `http://localhost:8080`).
   - `--users`: Number of users to generate (default: 1).
   - `--farms-per-user`: Number of farms per user (default: 1).
   - `--fields-per-farm`: Number of fields per farm (default: 5).
   - `--events-per-field`: Number of events per field (default: 10).
4. **Data Generation Logic**:
   - Use the `fake` crate to generate general text (like descriptions).
   - Localise data to a Northern Ireland agricultural setting:
     - Hardcode or generate local towns for locations (e.g., "Ballymena", "Coleraine", "Omagh", "Enniskillen").
     - Generate realistic farm names (e.g., "Hilltop Dairy", "Riverside Beef").
     - Define realistic event types (e.g., "Slurry Spreading", "Fertiliser Application", "Silage Cutting").
   - Iterate to build up the hierarchy: Users -> Farms -> FarmRecords, Fields -> Events.
5. **API Client (`reqwest`)**:
   - Create an async HTTP client to make `POST` requests to `/v0/users`, `/v0/farms`, `/v0/fields`, `/v0/events`, and `/v0/farm_records`.
   - Handle response deserialization to extract generated IDs for subsequent dependent records (e.g., extracting `user_id` from the User response to attach to a new `Farm` payload).
6. **Execution & Reporting**:
   - Output progress information (e.g., "Creating User 1/5...") and a summary of generated records to the console.
   - Implement graceful error handling if an API request fails, reporting the error and optionally halting execution.
