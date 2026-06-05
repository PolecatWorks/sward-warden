# Product Requirements Document: Fields-First UX for Farm Management

## Status
In Progress

## 1. Introduction
The objective of this project is to optimize the Sward Warden user interface for farm and field management. Since the majority of users manage only a single farm, the current farm-centric structure introduces unnecessary navigation overhead. The system should prioritize the presentation of fields over farms by default and optimize the layout dynamically based on the number of farms in the user's portfolio.

## 2. Goals & Objectives
*   Simplify the primary workflow for users by placing their fields at the forefront.
*   Reduce cognitive load and save screen space for single-farm users.
*   Retain full support and clarity for multi-farm users.
*   Deliver a responsive, intuitive, and modern UI/UX design.

## 3. Scope
**In Scope:**
*   Re-designing the "Farms and Fields" page in the front-end application (`sw-fe-container`).
*   Implementing summary/toggle cards at the top of the page for "Fields" and "Farms".
*   Defaulting to the "Fields" view displaying all fields in a flat list.
*   Implementing conditional rendering to hide farm-specific controls when only a single farm is present.

**Out of Scope:**
*   Back-end changes or API modifications (data structures are assumed to remain the same).
*   Changes to geographic field mapping / GIS views (this PRD focuses on the tabular/list views).

## 4. Requirements

### 4.1. Functional Requirements
*   **REQ-1 (Default Fields View)**: On page load, the application must default to displaying a flat list of all fields.
*   **REQ-2 (Summary Cards)**: The top of the page must feature interactive summary cards for "Fields" (showing total field count) and "Farms" (showing total farm count).
*   **REQ-3 (Single Farm Optimization)**: If a user has exactly one farm:
    *   The "Farms" summary card/toggle must be hidden.
    *   The "Farm" column in the Fields list view must be hidden.
*   **REQ-4 (Multi-Farm Optimization)**: If a user has more than one farm:
    *   The "Farms" summary card/toggle must be visible and selectable.
    *   The Fields list view must display a "Farm" column to show which farm each field belongs to.
    *   Selecting the "Farms" card must switch the view to display a list of all farms.

### 4.2. Non-Functional Requirements
*   **NFR-1 (Usability)**: The toggle between Fields and Farms must be smooth and reactive.
*   **NFR-2 (Responsive Design)**: The tables and cards must scale gracefully on different screen sizes according to the project's responsive guidelines.

## 5. Technical Considerations
*   The front-end is built using Angular. Conditional views should be managed through standard Angular templates using structural directives (e.g., `@if`, `@for` or `*ngIf`, `*ngFor`).
*   State management should compute the number of farms dynamically from the loaded user profile or organization state.
