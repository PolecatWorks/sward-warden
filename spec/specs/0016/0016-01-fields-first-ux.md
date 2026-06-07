# Specification 0016-01: Fields-First UX for Farm Management

**State**: Superceeded (by [0016-02](./0016-02-fields-first-card-ux.md))

## Overview
This specification details the UI/UX changes required to optimize the "Farms and Fields" page for users, particularly those with a single farm. The goal is to prioritize the presentation of fields over farms, reducing cognitive load and simplifying the primary workflow for the majority of users.

## Requirements

1. **Top-Level Toggle/Summary Cards:**
   - The UI shall present two summary cards at the top of the "Farms and Fields" page: "Fields" and "Farms".
   - The "Fields" card shall be selected by default upon page load.
   - The "Fields" card shall display the total count of fields the user owns.
   - The "Farms" card shall display the total count of farms the user owns.

2. **Fields View (Default):**
   - When the "Fields" card is selected, the main view area below shall display a list of *all* fields in the user's portfolio, flattened and irrespective of the farm they belong to.
   - The list should include key information such as Field Name, Area/Size, Crop type, and Last Activity date.

3. **Single Farm Optimization:**
   - If the user has only **one** farm in their portfolio:
     - The "Farms" summary card toggle shall be hidden entirely.
     - The "Farm Name" or "Farm" column in the Fields list view shall be hidden to save screen space.
   - If the user has **more than one** farm:
     - The "Farms" summary card shall be visible and clickable.
     - The Fields list view shall include a "Farm" column to indicate which farm each field belongs to.

4. **Farms View:**
   - When the user selects the "Farms" summary card (only possible for multi-farm users), the main view area shall change to display the list of their farms.

## Technical Considerations
- The changes are strictly localized to the Front-End (`sw-fe-container`).
- The relevant Angular components managing the display of Farms and Fields will need to be updated to implement this toggle logic and conditional rendering.
- State management will need to handle the currently selected view (Fields vs. Farms) and compute the visibility of elements based on the length of the user's farms array.

## Acceptance Criteria
- User with 1 farm sees only the "Fields" summary card and a list of all their fields (without a Farm column).
- User with >1 farm sees both "Fields" and "Farms" summary cards.
- Clicking "Farms" switches the view to list the farms.
- The default view is always the Fields list.
- The Fields list shows all fields for all farms when viewed by a multi-farm user, including a column indicating the farm.
