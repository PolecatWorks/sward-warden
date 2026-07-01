# Specification 0003-15: Auto-Farm Creation Name Resolution

**State**: Complete

## 1. Overview
This specification details the resolution of the contradiction regarding the default farm name during auto-creation for beginner users.

## 2. Requirements

- **REQ-8 (Auto-Farm Creation for Beginners)**: When a user creates their first field but has not yet created a farm, the frontend system must automatically create a farm. The farm name should be `"[User's Name]'s Farm"`. If the user's name is not available, it should fallback to `"My Farm"`.

## 3. Implementation Details

- **`sw-fe-container/src/app/home/fields/fields.component.ts`**: The logic for auto-creating a farm when adding a field and no farms exist is implemented in the `addField()` method. The component fetches the user details and generates the name using ``const newFarmName = user && user.name ? `${user.name}'s Farm` : 'My Farm';``.
- **Correction to Previous Specs**: Specification `0016-03` incorrectly stated that the backend (`sw-be-container/src/webserver/fields.rs`) automatically creates the farm named `"My Farm"`. The actual implementation is correctly handled by the frontend.
