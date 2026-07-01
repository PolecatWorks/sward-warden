# PRD 0003: Core Domain: Users, Farms & Fields

## Overview
This document defines the requirements for managing the core agricultural entities of the application: User Profiles, Farms, and Fields. It consolidates previous requirements that evolved over multiple iterations (PRDs 0003, 0016, 0023) into a single, cohesive fields-first UX model.

## 1. User Profile Management
- **Hero-Style Profile:** A premium profile view accessible via a top bar avatar icon located on the top right on all devices.
- **Inline Editing:** The profile page features a pencil icon button next to the user's name opening a modal dialog to update name, email, phone, and description. Avoid always-visible editable inputs.
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
- **List & Card Layout:** Farm cards feature an image header, name, area, and edit pencil icon in the bottom drawer. Clicking the card navigates to the farm detail view.
- **Safe Deletion:** Farms can only be deleted from the Farm Details page (`/farms/:farmId`) via a red trash can icon revealing an inline confirmation. Deletion is blocked (FE & BE) if active fields remain attached.
- **Empty State:** A full-width, center-aligned empty state card with a prominent "Add Farm" button.

## 4. Field Management
- **List & Card Layout:** Field list cards use the same visual pattern as farm cards. The list uses a responsive grid layout. Clicking the card navigates to the field detail view (`/fields/:fieldId`). No separate "View Details" button is permitted.
- **Field Deletion:** Deletion is strictly isolated to the Field Detail page via a trash can icon and inline confirmation.
- **Empty State:** Center-aligned empty state card with a prominent "Add Field" button.
- **Field Migration:** Users can edit field details and migrate a field to another farm via the Farm selector.

## 5. Creation Forms & Auto-Farm Logic
- **Unified Add Action:** When lists are populated, "Add Field" / "Add Farm" actions are presented as large, centered buttons at the bottom of the content area (no floating action buttons).
- **Identical Edit Forms:** The "Edit Field" form must be identical whether accessed from the List View or Detail View (inputs for Name, Area, Land Use, Farm Selector, Geometry).
- **Auto-Farm Creation (Beginner Flow):**
  - If a user has 0 farms and creates a field, the Farm selector is hidden. The backend automatically creates a default farm (`"[Name]'s Farm"`) and assigns the field.
  - If a user has exactly 1 farm, the Farm selector defaults to that farm automatically during field creation.

## 6. Security & Ownership Enforcement
- **Backend Verification:** The backend strictly enforces that users can only list, view, create, update, or delete farms and fields that they own, enforced via the secure user identity extracted from the token.
