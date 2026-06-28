# PRDs Index

This directory contains Product Requirements Documents (PRDs).

PRDs dictate the high-level features and requirements of the project. Every PRD added here should be analyzed for ambiguities and contradictions before being broken down into technical specifications.

**Note**: All functions in the backend codebase should include comments referencing the PRDs they support. If a function references more than 3 PRDs, use a generic note instead of listing them all.

## Contradictions Identified

- **Spatial Data Format**: PRD 0023 states that Edit forms must include `Geometry (WKT)`. However, PRD 0024 states that the frontend will communicate spatial data with the backend using the standard `GeoJSON` format.
- **Authentication Headers vs JWT**: PRD 0010, PRD 0017, and PRD 0018 specify the use of the `X-User-ID` header (and role derivation from it) for identifying users and roles on the backend. PRD 0020 explicitly requires replacing these headers with an `Authorization: Bearer <token>` JWT flow.
- **Admin Access & Endpoints**: PRD 0010 states admin users access records via "dedicated admin endpoints". PRD 0018 states that standard endpoints (like `GET /farms` and `/sync`) should simply bypass ownership filters for admins. Additionally, PRD 0013 states support/admin views should initially be "read-only", whereas PRD 0018 explicitly grants admins full reading, updating, and deleting rights.
- **Navigation Menu Layout**: PRD 0002 and PRD 0016 dictate a navigation bar order including "Dashboard" and "Compliance". PRD 0022 (Option A, Recommended) proposes eliminating "Dashboard" and "Compliance" from the navigation menu in favor of a consolidated "Home" view.
- **Default Farm Name**: PRD 0003 states that when auto-creating a farm for a beginner flow, the default farm should be named `"My Farm"`. PRD 0016 states it should be named `"[User's Name]'s Farm"` (with `"My Farm"` as a fallback).

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
