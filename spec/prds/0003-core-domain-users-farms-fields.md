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
