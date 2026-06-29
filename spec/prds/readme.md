# PRDs Index

This directory contains Product Requirements Documents (PRDs).

PRDs dictate the high-level features and requirements of the project. Every PRD added here should be analyzed for ambiguities and contradictions before being broken down into technical specifications.

**Note**: All functions across the frontend, backend, and robot tests should include comments referencing the PRDs they support. If more than 3 PRDs require the function then it should be labelled as `References more than 3 PRDs`, and should not reference which specific PRDs. If no obvious PRD requirement can be inferred, use `No obvious PRD requirement`.

## Contradictions Identified

- **Authentication Headers vs JWT**: PRD 0010, PRD 0017, and PRD 0018 specify the use of the `X-User-ID` header (and role derivation from it) for identifying users and roles on the backend. PRD 0020 explicitly requires replacing these headers with an `Authorization: Bearer <token>` JWT flow.
- **Navigation Menu Layout**: PRD 0002 and PRD 0016 dictate a navigation bar order including "Dashboard" and "Compliance". PRD 0022 (Option A, Recommended) proposes eliminating "Dashboard" and "Compliance" from the navigation menu in favor of a consolidated "Home" view.

## Current PRDs

- [0001 Application Architecture](./0001-app-architecture.md)
- [0002 FE Requirements](./0002-fe.md)
- [0003 User Profile and Farms](./0003-user-profile-and-farms.md)
- [0004 Sward Spreading Records](./0004-sward-spreading-records.md)
- [0005 Farm Sustainability Standards](./0005-farm-sustainability-standards.md)
- [0006 Inventory and Equipment](./0006-inventory-and-equipment.md)
- [0007 Reporting and Export](./0007-reporting-and-export.md)
- [0008 Optimization, Weather, and Topology Mapping](./0008-optimization-and-mapping.md)
- [0009 Be Architecture Refactor](./0009-be-architecture-refactor.md)
- [0010 Database Integration](./0010-database-integration.md)
- [0011 Offline Capabilities](./0011-offline-capabilities.md)
- [0012 Responsive Design](./0012-responsive-design.md)
- [0013 Administration and Support Console](./0013-administration-console.md)
- [0014 Seed Data Generator](./0014-seed-data-generator.md)
- [0015 Security CORS Policy Hardening](./0015-security-cors.md)
- [0016 Fields-First UX for Farm Management](./0016-fields-first-ux.md)
- [0017 Dev User Authentication & Multi-User Testing](./0017-dev-user-authentication.md)
- [0018 Multi-User Data Isolation and Admin Visibility](./0018-multi-user-data-isolation-and-admin-visibility.md)
- [0019 Field Event Logging UX and Validation](./0019-field-event-logging-ux-and-validation.md)
- [0020 Dev JWT Authentication](./0020-dev-jwt-auth.md)
- [0023 Field Creation & Edit Farm Selector enhancements](./0023-field-creation-edit-farm-selector.md)
- [0024 Field Topology Creation and Editing](./0024-field-topology-creation.md)

## PRD gaps

Based on a review of the PRDs, the following features have not yet been implemented:

- **Team Members (PRD 0003)**: Team member management has not yet been fully discussed or defined, and is marked as a future TODO.
- **Historical Audit Log (PRD 0006)**: Maintain a historical audit log of manual calibrations for storage prediction rates.
- **Live Weather API Integration (PRD 0008)**: Weather information is currently provided via static datasets for the initial version. The API integration is planned for future phases.
- **Secure JWT Validation (PRD 0010)**: Fully implement secure JWT validation in the backend and ensure the frontend passes standard `Authorization: Bearer <token>` headers instead of relying on `X-User-ID` before the application moves to production.
- **Account Suspension (PRD 0013)**: Ability to suspend or deactivate user accounts from the Administration Console.
- **High-Density Grid/Point Cloud Topography (PRD 0021)**: Storage of raw, detailed topographical data (Approach 2) is a future consideration for advanced agronomic features.
- **Modal Keyboard Accessibility (PRD 0023)**: The escape and enter to submit functions in modals are not universally applied or not fully compliant with the "disabled submit button without changes" requirement.
- **Official Government Data Auto-Detection (PRD 0024)**: Fetching official subsidized boundaries via Government APIs (e.g., UK RPA Land Parcels API or DAERA Open Data) using Single Business Identifier (SBI).
- **Field Snapping (PRD 0024)**: The drawing tool should optionally snap to visible features or adjacent field boundaries to prevent overlaps and gaps.
- **AI Auto-Detection (PRD 0024)**: The current `Auto-Detect (Stub)` in the Field Map Editor needs to be replaced with a real call to a service like Farmdok or Agrimetrics.

## Ambiguities to be resolved

- **Field Geometries (PRD 0024 vs PRD 0023)**: PRD 0024 mentions that for undefined boundaries, "a single point representing the centre of the field can be used instead of a polygon." However, PRD 0023 requires the edit forms to include inputs for "Geometry (GeoJSON)", and PRD 0024 specifies the backend stores boundaries as `GEOGRAPHY(Polygon, 4326)`. It is ambiguous how a single point (Point GeoJSON) should be handled on the frontend during edits and how it is stored in a `Polygon` column in the database (e.g., whether it is automatically buffered into a small polygon or if the column type needs adjusting).
- **Inventory Storage vs Full Inventory (PRD 0006 vs PRD 0023)**: PRD 0006 recommends "Multiple Specific Tables" for inventory tracking. PRD 0023 explicitly scopes the creation of the `inventory_storage` table. It is ambiguous whether the other inventory items (chemical products, equipment) should also have their tables defined immediately or if PRD 0023 scopes work solely to the storage layer for now.
- **Admin Role Definition (PRD 0010 vs PRD 0020)**: PRD 0010 allows admin users to see all records, bypassing ownership filters. PRD 0020 states that a custom JWT claim `sward_roles` (or similar) will contain the roles. The exact format and structure of this claim (e.g., whether it is an array of strings or a comma-separated string) is not explicitly defined, which is required for robust backend authorization checks.
- **Modal Keyboard Accessibility Scope (PRD 0023)**: The requirement states: "The submit button within any modal must remain disabled until a change has been made that needs to be saved (dirty state)." It is ambiguous whether this applies to "Add" modals (where all fields start empty but become "dirty" as soon as one is filled, yet the form might still be invalid) or if it only applies to "Edit" modals where changes to existing data dictate the "dirty" state.
- **Application Rate Calculation (PRD 0005)**: PRD 0005 states a maximum application of 50m³ of sward or 50 tonnes of solid manure per hectare. It is ambiguous whether the user inputs the total volume applied and the system calculates the per-hectare rate using the field's area, or if the user inputs the rate directly. If the system calculates it based on area, it's unclear how this is calculated for fields that only have a centre point (as per PRD 0024) and no defined polygon area.
