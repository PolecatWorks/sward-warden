# PRDs Index

This directory contains Product Requirements Documents (PRDs).

PRDs dictate the high-level features and requirements of the project. Every PRD added here should be analyzed for ambiguities and contradictions before being broken down into technical specifications.

**Note**: All functions in the backend codebase should include comments referencing the PRDs they support. If a function references more than 3 PRDs, use a generic note instead of listing them all.

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
