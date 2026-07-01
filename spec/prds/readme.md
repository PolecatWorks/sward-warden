# PRDs Index

This directory contains Product Requirements Documents (PRDs).

PRDs dictate the high-level features and requirements of the project. Every PRD added here should be analyzed for ambiguities and contradictions before being broken down into technical specifications.

**Note**: All functions across the frontend, backend, and robot tests should include comments referencing the PRDs they support. If more than 3 PRDs require the function then it should be labelled as `References more than 3 PRDs`, and should not reference which specific PRDs. If no obvious PRD requirement can be inferred, use `No obvious PRD requirement`.

## Current PRDs

- [0001 Core Architecture & Infrastructure](./0001-core-architecture-and-infrastructure.md)
- [0002 Frontend Foundations & UX Patterns](./0002-frontend-foundations-and-ux.md)
- [0003 Core Domain: Users, Farms & Fields](./0003-core-domain-users-farms-fields.md)
- [0004 Event Logging & Spreading Records](./0004-event-logging-and-records.md)
- [0005 Sustainability, Compliance & Reporting](./0005-sustainability-compliance-reporting.md)
- [0006 Inventory & Storage Management](./0006-inventory-and-storage.md)
- [0008 Spatial Data, Mapping & Optimization](./0008-spatial-data-mapping-optimization.md)
- [0013 Administration & Multi-Tenant Features](./0013-administration-and-multi-tenant.md)
- [0014 Development & Testing Tools](./0014-development-and-testing-tools.md)

## Evolution Mapping

The PRDs have evolved to their current self-contained form through a process of consolidation. To trace back historical features, the mapping of old fragmented PRDs to the current domains is as follows:

- **PRD 0001** consolidated: 0001, 0009, 0010, 0011, 0015
- **PRD 0002** consolidated: 0002, 0012, 0022, 0025
- **PRD 0003** consolidated: 0003, 0016, 0023
- **PRD 0004** consolidated: 0004, 0019
- **PRD 0005** consolidated: 0005, 0007
- **PRD 0006** consolidated: 0006, 0026
- **PRD 0008** consolidated: 0008, 0021, 0024, 0029
- **PRD 0013** consolidated: 0013, 0018, 0028
- **PRD 0014** consolidated: 0014, 0017, 0020, 0027

## PRD gaps

Based on a review of the PRDs, the following features have not yet been implemented:

- **Team Members (PRD 0003)**: Team member management has not yet been fully discussed or defined, and is marked as a future TODO.
- **Historical Audit Log (PRD 0006)**: Maintain a historical audit log of manual calibrations for storage prediction rates.
- **Live Weather API Integration (PRD 0008)**: Weather information is currently provided via static datasets for the initial version. The API integration is planned for future phases.
- **High-Density Grid/Point Cloud Topography (PRD 0008)**: Storage of raw, detailed topographical data (Approach 2) is a future consideration for advanced agronomic features.
- **Modal Keyboard Accessibility (PRD 0002)**: The escape and enter to submit functions in modals are not universally applied (e.g. Storage Capacity) or not fully compliant with the "disabled submit button without changes" requirement.
- **Official Government Data Auto-Detection (PRD 0008)**: Fetching official subsidized boundaries via Government APIs (e.g., UK RPA Land Parcels API or DAERA Open Data) using Single Business Identifier (SBI).
- **Field Snapping (PRD 0008)**: The drawing tool should optionally snap to visible features or adjacent field boundaries to prevent overlaps and gaps.
- **AI Auto-Detection (PRD 0008)**: The current `Auto-Detect (Stub)` in the Field Map Editor needs to be replaced with a real call to a service like Farmdok or Agrimetrics.
