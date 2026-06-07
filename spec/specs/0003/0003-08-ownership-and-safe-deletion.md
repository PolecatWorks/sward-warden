# Specification 0003-08: Ownership & Safe Deletion

**State**: Complete

## 1. Overview
This specification details the backend and frontend changes to enforce user ownership of data, safe farm deletion, field migration, and split navigation of fields and farms.

## 2. Requirements

- **Safe Farm Deletion**: Farm deletion must block on both the frontend and backend if active (non-deleted) fields belong to the farm.
  - Frontend: Show a warning and disable the delete button.
  - Backend: Return HTTP 400 rejection.
- **Field Migration**: Allow users to edit field details and migrate a field to another farm in their portfolio.
- **Separate Navigation**: Split Farms and Fields into separate top-level navigation items.
- **Backend Verification**: The backend must verify that the authenticated user owns any farm, field, or related entities (events, records, soil analyses, plans, applications, compliance breaches, sward movements) when listing, viewing, creating, updating, or deleting them.

## 3. Changes

- **`sw-fe-container/src/app/home/farm-detail/`**: Enabled safe delete warnings and disabled delete buttons if fields list length > 0. Added inline confirmation.
- **`sw-fe-container/src/app/home/field-view/`**: Added destination farm select dropdown to the Edit Field modal.
- **`sw-be-container/src/webserver/farms.rs`**: Added active fields check before deleting farm. Added user ID verification to all queries.
- **`sw-be-container/src/webserver/fields.rs`**: Validates target farm belongs to the user during creation/update.
- **Other webserver modules**: Enforce `UserId` checks on all operations.
