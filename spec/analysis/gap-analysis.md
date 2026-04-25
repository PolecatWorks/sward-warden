# Gap Analysis Report: PRD vs. Code Implementation

This report details the gaps between the Product Requirements Documents (PRDs) and the current state of the codebase. It highlights areas where features specified in the PRDs are either missing, partially implemented, or incorrectly implemented in the code.

## PRD 0001: Application Architecture
**Status**: Partially Implemented

**Gaps:**
*   **Security (OAuth2/OIDC & Istio):** The backend currently does not handle any authentication or extract user identity from headers provided by an Istio sidecar. It uses a hardcoded `user_id = 1` for multi-tenancy in `sw-be-container/src/webserver/mod.rs`.
*   **Data Sources (Static Data & Weather):** There are no static datasets for regulatory code lists (MAPP, EPPO, BBCH) implemented in the backend, nor is there any weather information integration yet.

## PRD 0002: UI Requirements
**Status**: Partially Implemented / Scaffolding only

**Gaps:**
*   While the frontend Angular project (`sw-fe-container`) has scaffolding for components like `sward-dashboard`, `compliance-tracking`, `optimization-engine`, `weather-integration`, `topology-mapping`, and `waterway-protection` (as seen in `sw-fe-container/src/app/`), these are mostly empty shells. The actual UI logic, features, data bindings, and visual elements described in the PRD (like interactive alerts, bento grid patterns, risk assessment mapping) are missing.

## PRD 0003: User Profile and Farms
**Status**: Partially Implemented

**Gaps:**
*   **Event Tracking (Spraying):** The `Event` model in `sw-be-container/src/models.rs` only has a generic `description` field. It does not include the required fields for Spraying events (MAPP number, EPPO crop code, and BBCH growth stage) as explicitly stated in PRD 0003 and PRD 0005. The database schema in `sw-be-container/migrations/0001_initial_schema.sql` also lacks these fields.

## PRD 0004: Sward Spreading Records
**Status**: Scaffolding only

**Gaps:**
*   **Data Models:** The backend models and database schema only cover very basic entities (`User`, `Farm`, `Field`, `Event`, `FarmRecord`). The specific data structures required for "General Farm Records" (detailed), "Fertiliser Application Records", "Fertilisation Plan", "Fertilisation Account", "Import and Export Records", "Soil Analysis Results", and "Spreading Equipment Exemptions" are completely missing from `models.rs` and the database migration scripts.
*   **Frontend UI:** Similar to PRD 0002, the frontend only has scaffolded directories for these features without implementation.

## PRD 0005: Farm Sustainability Standards (FSS)
**Status**: Not Implemented

**Gaps:**
*   **Spraying Records:** As noted in PRD 0003 gaps, the mandatory MAPP, EPPO, and BBCH fields are missing from the backend data models and database schema for `Event` or a dedicated Spraying record model. The required static data lists are also not present.
*   **Compliance Logic:** There is no backend logic or rules engine implemented to enforce closed spreading periods, urea/nitrogen limits, phosphorus restrictions, buffer zones, weather/soil condition checks, application limits, equipment requirements, or storage capacities.
*   **Penalty Matrix:** No implementation exists for tracking audit breaches or calculating penalties.

## PRD 0006: Inventory and Equipment
**Status**: Scaffolding only

**Gaps:**
*   No backend models or database tables exist for tracking storage capacity, chemical/pesticide inventory, equipment tracking, or import/export contracts.
*   Frontend has scaffolded folders but no implementation.

## PRD 0007: Reporting and Export
**Status**: Scaffolding only

**Gaps:**
*   No backend functionality for generating or exporting reports (Digital Pesticide Records, Annual Fertilisation Accounts, General Farm Records, Soil Analysis Reports, Import/Export Reporting).
*   Frontend has scaffolded folders but no implementation.

## PRD 0008: Optimization, Weather, and Topology Mapping
**Status**: Scaffolding only

**Gaps:**
*   No backend logic or API integrations for optimization engines, weather forecasting, or topology/field mapping analysis.

## PRD 0009: Backend Architecture Refactor
**Status**: Mostly Implemented

**Gaps:**
*   The refactor has been largely applied (figment config, AppState, hams, modularized routing).
*   **Routing Organization:** While `webserver/mod.rs` was created, the routes were not broken out into separate files (e.g., `users.rs`, `farms.rs`) as specified in the PRD. All routes are still housed within `webserver/mod.rs`.
*   **Unified Error Handling:** `MyError` is used, but it's not clear if it fully implements the intended comprehensive `AppError` structure described.

## PRD 0010: Database Integration and Multi-Tenancy
**Status**: Mostly Implemented

**Gaps:**
*   **Multi-Tenancy:** The code currently hardcodes `user_id = 1` in SQL queries within `webserver/mod.rs` (e.g., `WHERE user_id = 1`) to simulate an authenticated user session, as per the PRD's instruction for the initial phase. However, true dynamic multi-tenancy based on authenticated user context is not yet implemented.
