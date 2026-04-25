# Specifications Index

This directory contains Technical Specifications derived from the PRDs.

Once a PRD in `spec/prds/` is vetted, it is broken down into specific actionable items documented here. Development only begins after complete specs are defined, following a Test-Driven Development (TDD) approach.

## Current Specs

- [0001-01 Frontend Specification](./0001-01-frontend.md)
- [0001-02 Backend Specification](./0001-02-backend.md)
- [0001-03 Deployment Specification](./0001-03-deployment.md)
- [0002-01 Dashboard Specification](./0002-01-dashboard.md)
- [0002-02 Compliance Tracking Specification](./0002-02-compliance-tracking.md)
- [0002-03 Optimization Engine Specification](./0002-03-optimization-engine.md)
- [0002-04 Weather Integration Specification](./0002-04-weather-integration.md)
- [0002-05 Topology and Field Mapping Specification](./0002-05-topology-mapping.md)
- [0002-06 Waterway Protection Specification](./0002-06-waterway-protection.md)
- [0002-07 User Profile and Farm Management UI Specification](./0002-07-user-profile-and-farm-management-ui.md)
- [0002-08 Event Tracking UI Specification](./0002-08-event-tracking-ui.md)
- [0002-09 Inventory and Equipment UI Specification](./0002-09-inventory-and-equipment-ui.md)
- [0002-10 Reporting and Export UI Specification](./0002-10-reporting-and-export-ui.md)
- [0003-01 User Profile Management Specification](./0003-01-user-profile-management.md)
- [0003-02 Farm Management Specification](./0003-02-farm-management.md)
- [0003-03 Field Management Specification](./0003-03-field-management.md)
- [0003-04 Event Tracking Specification](./0003-04-event-tracking.md)
- [0004-01 General Farm Records Specification](./0004-01-general-farm-records.md)
- [0004-02 Fertiliser Application Records Specification](./0004-02-fertiliser-application-records.md)
- [0004-03 Fertilisation Plan Specification](./0004-03-fertilisation-plan.md)
- [0004-04 Fertilisation Account Specification](./0004-04-fertilisation-account.md)
- [0004-05 Import and Export Records Specification](./0004-05-import-export-records.md)
- [0004-06 Soil Analysis Results Specification](./0004-06-soil-analysis-results.md)
- [0004-07 Spreading Equipment Exemptions Specification](./0004-07-spreading-equipment-exemptions.md)
- [0005-01 Spraying (Pesticide Use) Records Specification](./0005-01-spraying-records.md)
- [0005-02 Chemical Fertiliser Management Specification](./0005-02-chemical-fertiliser-management.md)
- [0005-03 Sward and Organic Manure Management Specification](./0005-03-sward-and-organic-manure-management.md)
- [0005-04 Compliance Penalty Matrix Specification](./0005-04-compliance-penalty-matrix.md)
- [0006-01 Storage Capacity Tracking Specification](./0006-01-storage-capacity-tracking.md)
- [0006-02 Chemical and Pesticide Inventory Specification](./0006-02-chemical-and-pesticide-inventory.md)
- [0006-03 Equipment Tracking Specification](./0006-03-equipment-tracking.md)
- [0006-04 Import and Export Contracts Specification](./0006-04-import-export-contracts.md)
- [0007-01 Digital Pesticide Records Export Specification](./0007-01-digital-pesticide-records-export.md)
- [0007-02 Annual Fertilisation Accounts Specification](./0007-02-annual-fertilisation-accounts.md)
- [0007-03 General Farm Records Export Specification](./0007-03-general-farm-records-export.md)
- [0007-04 Soil Analysis Reports Specification](./0007-04-soil-analysis-reports.md)
- [0007-05 Import and Export Reporting Specification](./0007-05-import-export-reporting.md)
- [0008-01 Optimization Engine Core Specification](./0008-01-optimization-engine-core.md)
- [0008-02 Weather Integration Data Specification](./0008-02-weather-integration-data.md)
- [0008-03 Topology and Waterway Data Specification](./0008-03-topology-and-waterway-data.md)
- [0008-04 Optimization & Mapping UI Specification](./0008-04-optimization-mapping-ui.md)
- [0011-01 RxDB Local Database Setup Specification](./0011-01-rxdb-local-database.md)
- [0011-02 Network Status and Sync UI Specification](./0011-02-network-status-ui.md)
- [0011-03 Backend Delta Sync API Specification](./0011-03-backend-delta-sync-api.md)
- [0011-04 Outbox Pattern and Push Sync Specification](./0011-04-outbox-pattern-push-sync.md)
- [0011-05 Delta Sync Client and Conflict Resolution Specification](./0011-05-delta-sync-client-and-conflict-resolution.md)

- [0012-01 Adaptive Layouts Specification](./0012-01-adaptive-layouts.md)
- [0012-02 Component Scaling and Typography Specification](./0012-02-component-scaling-and-typography.md)
- [0012-03 Responsive Design Implementation Guidelines](./0012-03-implementation-guidelines.md)

## Implementation Sequence for Remaining Work

Based on dependencies and logical flow, the following order is proposed for completing the remaining uncompleted technical specifications (those in 'Open' status):

### Phase 1: Foundation Data & Planning
These specs establish the foundational soil data and high-level fertilisation plans required for specific application events.
1. **[0004-06 Soil Analysis Results Specification](./0004-06-soil-analysis-results.md)**
2. **[0004-03 Fertilisation Plan Specification](./0004-03-fertilisation-plan.md)**
3. **[0004-04 Fertilisation Account Specification](./0004-04-fertilisation-account.md)**

### Phase 2: Core Records & Application
With plans in place, these specs handle the actual recording of spraying and fertilisation events.
4. **[0004-02 Fertiliser Application Records Specification](./0004-02-fertiliser-application-records.md)**
5. **[0005-01 Spraying (Pesticide Use) Records Specification](./0005-01-spraying-records.md)**
6. **[0005-02 Chemical Fertiliser Management Specification](./0005-02-chemical-fertiliser-management.md)**
7. **[0005-03 Sward and Organic Manure Management Specification](./0005-03-sward-and-organic-manure-management.md)**

### Phase 3: Exemptions & Logistics
These specs cover exceptions and logistical movements (imports/exports) that affect the overall nutrient balance.
8. **[0004-05 Import and Export Records Specification](./0004-05-import-export-records.md)**
9. **[0004-07 Spreading Equipment Exemptions Specification](./0004-07-spreading-equipment-exemptions.md)**

### Phase 4: Compliance
This spec ties the recorded data against rules to generate compliance penalties.
10. **[0005-04 Compliance Penalty Matrix Specification](./0005-04-compliance-penalty-matrix.md)**

### Phase 5: Offline Capabilities
These specs implement the local-first architecture and synchronisation layer. They should be implemented after core data flows are stable, as they wrap the existing CRUD operations with offline resilience. The order below reflects internal dependencies within the offline feature set.
11. **[0011-01 RxDB Local Database Setup Specification](./0011-01-rxdb-local-database.md)** — Frontend foundation: installs RxDB and rewires services to a local-first data path.
12. **[0011-02 Network Status and Sync UI Specification](./0011-02-network-status-ui.md)** — Quick win: adds the connectivity indicator and sync state services consumed by later specs.
13. **[0011-03 Backend Delta Sync API Specification](./0011-03-backend-delta-sync-api.md)** — Backend foundation: adds `updated_at`/`is_deleted` columns and the `GET /api/sync` endpoint.
14. **[0011-04 Outbox Pattern and Push Sync Specification](./0011-04-outbox-pattern-push-sync.md)** — Push path: queues offline writes and sends them when connectivity returns. Depends on 0011-01 and 0011-02.
15. **[0011-05 Delta Sync Client and Conflict Resolution Specification](./0011-05-delta-sync-client-and-conflict-resolution.md)** — Pull path: fetches server changes, merges into local DB, and resolves conflicts via LWW. Depends on 0011-01, 0011-03, and 0011-04.


### Phase 6: Responsive Design
These specs handle adapting the UI for larger screens.
16. **[0012-01 Adaptive Layouts Specification](./0012-01-adaptive-layouts.md)**
17. **[0012-02 Component Scaling and Typography Specification](./0012-02-component-scaling-and-typography.md)**
18. **[0012-03 Responsive Design Implementation Guidelines](./0012-03-implementation-guidelines.md)**
