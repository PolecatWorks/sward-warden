# PRD 0003: Core Domain: Users, Farms & Fields

## Overview
This document defines the requirements for managing the core agricultural entities of the application: User Profiles, Farms, and Fields. It consolidates previous requirements that evolved over multiple iterations (PRDs 0003, 0016, 0023) into a single, cohesive fields-first UX model.

## 1. User Profile Management
- **Hero-Style Profile:** A premium profile view accessible via a top bar avatar icon located on the top right on all devices.
- **Inline Editing:** The profile page features a pencil icon button next to the user's name that hides the view state and replaces it with an inline, full-width edit form to update name, email, phone, and description. Modal dialogs are discouraged for editing entities on mobile devices.
- **Privacy:** General users cannot list or view other users in the system (`GET /users` must be restricted).
- **Team Members:** (TODO) Team member management is planned for a future phase.

## 2. Fields-First UX Model
Since the majority of users manage a single farm, the application prioritizes a "Fields-First" presentation to reduce navigation overhead.

- **Default View:** The application defaults to displaying a flat list of all fields.
- **Summary Cards:** Interactive summary cards at the top for "Fields" (total count) and "Farms" (total count).
- **Single-Farm Optimization:**
  - If a user has exactly one farm, the "Farms" summary card/toggle and the "Farm" column in the Fields list view are hidden.
- **Multi-Farm Optimization:**
  - If a user has >1 farm, the "Farms" summary card is visible. Selecting it switches to the Farms list.
  - Fields list displays a "Farm" column.

## 3. Farm Management
- **Farm Photo Upload:** Users can upload a photo for their farm. The image is resized client-side to save bandwidth and storage and sent as a base64 string to the backend. The photo will be shown on the farm card on the list view (with fallbacks to default imagery) and on the farm detail view.
- **List & Card Layout:** Farm cards feature an image header, name, area, and edit pencil icon in the bottom drawer. Clicking the card navigates to the farm detail view. The edit pencil icon must stop click propagation and open an edit modal. Farm lists must expand to utilize the full available screen width, displaying up to 3 cards per row on larger screens in a responsive grid layout.
- **Safe Deletion:** Farms can only be deleted from the Farm Details page (`/farms/:farmId`) via a red trash can icon revealing an inline confirmation. Deletion is blocked (FE & BE) if active fields remain attached.
- **Empty State:** A full-width, center-aligned empty state card with a prominent "Add Farm" button. The empty state card must span the full page width and not be constrained by grid layouts to ensure consistent center alignment.
- **Weather Safety Timeline:** The Farm Details page includes a weather safety timeline component that displays a 48-hour forecast and indicates whether application is safe or blocked based on precipitation risk.

## 4. Field Management
- **List & Card Layout:** Field list cards use the same visual pattern as farm cards, featuring a top image header (using `field.image_url` if available, otherwise a default agricultural landscape image), followed by a bottom drawer with the field name, area, and edit pencil icon (which stops click propagation and opens the edit modal). Clicking elsewhere on the card navigates to the field detail view (`/fields/:fieldId`). No separate "View Details" button is permitted. The list uses a responsive grid layout, expanding to utilize the full available screen width and displaying up to 3 cards per row on larger screens.
- **Field Deletion:** Deletion is strictly isolated to the Field Detail page via a trash can icon and inline confirmation.
- **Empty State:** Center-aligned empty state card with a prominent "Add Field" button. The empty state card must span the full page width and not be constrained by grid layouts to ensure consistent center alignment.
- **Field Migration:** Users can edit field details and migrate a field to another farm via the Farm selector.

## 5. Creation Forms & Auto-Farm Logic
- **Unified Add Action:** When lists are populated, "Add Field" / "Add Farm" actions are presented as large, centered buttons at the bottom of the content area (no floating action buttons).
- **Identical Edit Forms:** The "Edit Field" form must be identical whether accessed from the List View or Detail View (inputs for Name, Area, Land Use, Farm Selector, Geometry).
- **Auto-Farm Creation (Beginner Flow):**
  - If a user has 0 farms and creates a field, the Farm selector is hidden. The backend automatically creates a default farm (`"[Name]'s Farm"`) and assigns the field.
  - If a user has exactly 1 farm, the Farm selector defaults to that farm automatically during field creation.

## 6. Security & Ownership Enforcement
- **Backend Verification:** The backend strictly enforces that users can only list, view, create, update, or delete farms and fields that they own, enforced via the secure user identity extracted from the token.

## 7. User Journeys
The following end-to-end user journeys validate the core domain capabilities. These flows are tested in the automated robot test suite:

- **Profile Edit Journey (`test_profile.robot`)**: The integration testing suite must include an end-to-end user profile management journey. The journey must use the UI to edit the user's name, email, phone number, and description using the hero-style profile inline form (pencil edit button). Both clicking the save button and pressing the Enter key must be independently verified to ensure changes are successfully saved and exactly one updated record is stored. It must submit the changes, reload the page, and verify that all edited values persist correctly.
- **Farm Creation and Deletion Journey (`test_farm_flow.robot`)**: The integration testing suite must include a comprehensive end-to-end farm management journey. The journey must use the UI to trigger the add farm modal, fill in details (name and location), and save the farm. Creation must be tested independently for both clicking the save button and pressing the Enter key inside inputs, confirming in both cases that exactly one farm is created. It must verify the farm appears in the UI list, check that the farm exists in the database via the backend API, navigate to the farm detail page, trigger the delete action, confirm the deletion, and finally verify that the farm is removed from both the UI list and the backend API.
- **Farm Deletion Blocking and Field Migration Journey (`test_farm_flow.robot`)**: The integration testing suite must include a data safety journey validating that farm deletion is blocked when active fields exist. The journey must create two farms and a field under the first farm via the API. It must verify in the UI farm detail page that the delete button is disabled and a warning banner is shown for the first farm. It must then edit the field in the UI to migrate it to the second farm, verify that the first farm's delete button is now enabled and the warning is gone, delete the first farm, and verify it is removed from the UI.
- **Field Creation and Deletion Journey (`test_field_flow.robot`)**: The integration testing suite must include an end-to-end field management journey. The journey must select an existing farm, use the UI to add a field with a specified name and area. Creation must be tested independently for both clicking the save button and pressing the Enter key inside inputs, confirming in both cases that exactly one field is created. It must verify that the field appears in the UI list, confirm via the backend API that exactly one field is created, navigate to the field detail page in the UI, delete the field, and verify that the field is removed from both the UI and the backend API.
- **Auto Farm Creation Journey (`test_field_flow.robot`)**: The integration testing suite must include an auto-farm creation beginner journey for new users. The journey must verify that when a user with zero farms attempts to create a field via the UI, the farm selector is hidden. Upon submitting the field details, the system must automatically create a default farm in the background to house the field. The journey must verify the field and automatically created farm exist in the UI and then clean them up via the API.
