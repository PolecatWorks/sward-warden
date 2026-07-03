# 0003-18 Field List Editing and Creation Alignment Specification

**State**: Complete

## Scope
This specification describes the changes required to fix the routing issues for field editing/creation from the fields list, and to align the field creation form's user interface with the full-size field edit form.

## Proposed Changes
1. **Routing Updates** (`app.routes.ts`):
   - Add routes mapping `/fields/:fieldId/edit` to `FieldViewComponent`.
   - Add routes mapping `/fields/new` and `/farms/:farmId/fields/new` to `FieldsComponent`.
2. **Field Detail & Edit Mode Integration** (`FieldViewComponent`):
   - Subscribe to the routing url or query params in `FieldViewComponent`.
   - Automatically open the field edit modal/form if navigating to `/fields/:fieldId/edit`.
   - On cancel or successful update, navigate back to the field detail view (`/fields/:fieldId`).
3. **Field Creation Form Alignment** (`FieldsComponent`):
   - Subscribe to the routing url in `FieldsComponent`.
   - Automatically open the field creation form if navigating to a path ending in `/new`.
   - Update the styling and layout of the field creation form to match the "full-size" container style of the edit form.
   - Add the `Land Use` selector field to the creation form and model properties (`newFieldLandUse`).
   - On cancel or successful creation, navigate back to the appropriate parent view (`/fields` or `/farms/:farmId/fields`).

## Verification Plan
- Verify that clicking the edit button on a field card in the fields list navigates to the edit mode on the detail page.
- Verify that clicking the "Add Field" button on the fields list navigates to the creation form.
- Verify that canceling or saving the forms correctly redirects back.
- Run integration tests using `make robot-test` to ensure all tests pass.
