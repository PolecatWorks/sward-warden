# PRDs Index

This directory contains Product Requirements Documents (PRDs).

PRDs dictate the high-level features and requirements of the project. Every PRD added here should be analyzed for ambiguities and contradictions before being broken down into technical specifications.

**Note**: All functions across the frontend, backend, and robot tests should include comments referencing the PRDs they support. If more than 3 PRDs require the function then it should be labelled as `References more than 3 PRDs`, and should not reference which specific PRDs. If no obvious PRD requirement can be inferred, use `No obvious PRD requirement`.

## Contradictions Identified

None.

## Duplicated Functionality Resolved

- **Storage Capacities**: Consolidated into PRD 0026 (Storage Capacity Management).
- **Buffer Zones**: Consolidated into PRD 0008 (Optimization and Mapping).
- **LESSE**: Consolidated into PRD 0005 (Farm Sustainability Standards).
- **Import and Export Records**: Consolidated into PRD 0004 (Slurry Spreading Records).

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
- [0021 Topographical Data Analysis](./0021-topographical-data-analysis.md)
- [0022 Home View Consolidation](./0022-home-view-consolidation.md)
- [0023 Field Creation & Edit Farm Selector enhancements](./0023-field-creation-edit-farm-selector.md)
- [0024 Field Topology Creation and Editing](./0024-field-topology-creation.md)
- [0025 Modal Keyboard Accessibility](./0025-modal-keyboard-accessibility.md)
- [0026 Storage Capacity Management](./0026-storage-capacity-management.md)

## PRD gaps

Based on a review of the PRDs, the following features have not yet been implemented:

- **Team Members (PRD 0003)**: Team member management has not yet been fully discussed or defined, and is marked as a future TODO.
- **Historical Audit Log (PRD 0006)**: Maintain a historical audit log of manual calibrations for storage prediction rates.
- **Live Weather API Integration (PRD 0008)**: Weather information is currently provided via static datasets for the initial version. The API integration is planned for future phases.
- **Account Suspension (PRD 0013)**: Ability to suspend or deactivate user accounts from the Administration Console.
- **High-Density Grid/Point Cloud Topography (PRD 0021)**: Storage of raw, detailed topographical data (Approach 2) is a future consideration for advanced agronomic features.
- **Modal Keyboard Accessibility (PRD 0025)**: The escape and enter to submit functions in modals are not universally applied (e.g. Storage Capacity) or not fully compliant with the "disabled submit button without changes" requirement.
- **Official Government Data Auto-Detection (PRD 0024)**: Fetching official subsidized boundaries via Government APIs (e.g., UK RPA Land Parcels API or DAERA Open Data) using Single Business Identifier (SBI).
- **Field Snapping (PRD 0024)**: The drawing tool should optionally snap to visible features or adjacent field boundaries to prevent overlaps and gaps.
- **AI Auto-Detection (PRD 0024)**: The current `Auto-Detect (Stub)` in the Field Map Editor needs to be replaced with a real call to a service like Farmdok or Agrimetrics.

## Ambiguities to be resolved

None.

## Resolved Ambiguities

- **Field Geometries (PRD 0024 vs PRD 0023)**: Resolved. The backend stores fields as `GEOGRAPHY(Polygon, 4326)`. A single point could theoretically be buffered into a polygon on insertion, but currently the schema expects a Polygon GeoJSON string.
- **Inventory Storage vs Full Inventory (PRD 0006 vs PRD 0026)**: Resolved. PRD 0006 recommends "Multiple Specific Tables" for inventory tracking. PRD 0026 explicitly scopes the creation of the `inventory_storage` table as a starting point. The other inventory items (chemical products, equipment) will have their tables defined in subsequent scopes, adhering to the Multiple Specific Tables approach.
- **Admin Role Definition (PRD 0010 vs PRD 0020)**: Resolved. The JWT claim `sward_roles` is defined and implemented as an array of strings (e.g. `["admin"]`) in the backend authentication middleware.
- **Modal Keyboard Accessibility Scope (PRD 0025)**: Resolved. For "Add" modals, the submit button must be disabled until the form is both dirty and valid. For "Edit" modals, the submit button must be disabled until a change has been made to existing data (dirty state) and the form remains valid.
