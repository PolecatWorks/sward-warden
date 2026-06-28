# Product Requirements Document: Field Creation & Edit Farm Selector enhancements

## Status
Approved

## 1. Introduction
The objective of this PRD is to enhance the Sward Warden user interface for farm and field management by optimizing the field creation and editing experience. The focus is specifically on the Farm selector behavior when creating or editing fields.

## 2. Goals & Objectives
*   Simplify the field creation process for new users and single-farm users.
*   Standardize the field editing experience across different views (List View and Detail View).

## 3. Scope
**In Scope:**
*   Updating the "Add Field" modal behavior in the front-end application (`sw-fe-container`).
*   Updating the "Edit Field" inline modal in the Fields List View.
*   Updating the "Edit Field" modal in the Field Detail View.

**Out of Scope:**
*   Back-end API changes (we will utilize existing API endpoints).
*   Any changes to UI styling or design not directly related to these form fields.

## 4. Requirements

### 4.1. Functional Requirements
*   **REQ-1 (Auto-select Farm on Creation)**: When a user creates a new field and there is exactly 1 farm available, this farm must be automatically selected in the Farm dropdown.
*   **REQ-2 (Hide Farm Selector on Creation if No Farms)**: If no farm exists (0 farms), the Farm selector should not be presented in the "Add Field" modal. The application logic handles auto-creating a default farm and associating it upon submission.
*   **REQ-3 (Identical Edit Forms)**: The Edit Field form accessed from the Fields List view and the Edit Field form accessed from the Field Detail view must be identical.
*   **REQ-4 (Edit Form Fields)**: Both edit forms must include inputs for the following properties: Name, Area (Hectares), Land Use, Farm Selector, and Geometry (GeoJSON).
*   **REQ-5 (Update Farm Association)**: When editing a field from the List View, the user must be able to change the associated farm via the Farm selector.

### 4.2. Non-Functional Requirements
*   **NFR-1 (Consistency)**: Ensure validation logic and default values (e.g., default `land_use`) are consistent across both edit forms.

## 5. Technical Considerations
*   These changes will be implemented in the Angular frontend (`sw-fe-container`) within the `FieldsComponent` and `FieldViewComponent`.
