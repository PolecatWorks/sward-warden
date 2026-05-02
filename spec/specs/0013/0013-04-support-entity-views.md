# Spec 0013-04: Support Entity Explorer

## Status: Complete

## 1. Overview
Support staff need to drill down into a user's data to troubleshoot issues. This spec covers the views for exploring Farms, Fields, Events, and Farm Records associated with a user.

## 2. Requirements
- Navigation from a User detail view to their Farms.
- Listing of Fields for a specific Farm.
- Listing of Events (e.g., spreading activities) for a Field.
- High-level view of Farm Records (Agricultural Area, Manure Capacity).
- Read-only interface to prevent accidental data modification.

## 3. Technical Details
- **Fe Components**:
  - `AdminFarmListComponent`
  - `AdminFieldListComponent`
  - `AdminEventListComponent`
  - `AdminRecordViewComponent`
- **Be API**:
  - `GET /api/admin/users/:id/farms`
  - `GET /api/admin/farms/:id/fields`
  - `GET /api/admin/fields/:id/events`
  - `GET /api/admin/farms/:id/records`

## 4. Tasks
- [ ] Implement be support endpoints for Farms, Fields, Events, and Records.
- [ ] Create corresponding list and detail components in `sw-admin-container`.
- [ ] Implement breadcrumb navigation or hierarchical tree view for easy drilling.
- [ ] Ensure all fields are marked as read-only in this context.
