# PRD 0003: User Profile and Farms

## Overview
This document defines the requirements for user profiles and the management of farms, fields, and agricultural events within the application.

## Key Features

1. **User Profile Management**
   - **Profile Edit Interaction**: The profile page must not feature always-visible editable inputs or an inline "Edit Profile" form section. Instead, a pencil icon button must be displayed next to the user's name in the hero banner. Clicking this pencil icon opens a modal dialog (matching the farm/field edit modal pattern) allowing the user to update their name, email, phone, and description.
   - **Profile Content Restrictions**: Do not include navigation links to manage farms, reports, or inventory on the profile page itself (these are managed in other dedicated app areas).
   - **User Directory Privacy**: The backend API must block general users from listing all users in the system (`GET /users` must be rejected/restricted in non-dev environments). The profile page must not display list views of other users.
   - **Team Members (TODO)**: Team member management has not yet been fully discussed or defined, and is marked as a future TODO.

2. **Farm Management**
   - Once joined, users must be able to create and manage multiple farms within their account.
   - **Risky Delete Protection**: A farm cannot be deleted from the list view. Deletion is only accessible from a dedicated Farm Details page (`/farms/:farmId`).
   - **Farm Deletion UI**: Replace the large, noisy "Danger Zone" block with a simple red trash can icon button placed next to the edit pencil icon in the page header. Clicking this icon reveals an inline "Are you sure?" confirmation panel directly below the header actions.
   - **Safe Farm Deletion**: Farm deletion must block if there are any active (non-deleted) fields belonging to the farm. Users must migrate or delete the fields first. Enforced on both frontend (disabled state + warning) and backend (HTTP 400 rejection).
   - **List Layout & Experience**: The farms list view must offer a prominent, big "Add Farm" button similar to the fields list view. Each farm card must feature an edit pencil icon in the bottom drawer (matching the field card edit button pattern) which stops click propagation and opens a modal dialog allowing the user to update the farm's name and location.
   - **Empty State**: When no farms exist, display a prominent, center-aligned empty state card with an icon, welcoming description, and a large "Add Farm" button.

3. **Field Management**
   - Within each farm, users must be able to create and manage multiple fields.
   - **Field Deletion UI**: The delete button must not be visible on the fields list view. It is only accessible within the field detail page (`/fields/:fieldId`) as a red trash can icon button placed next to the edit pencil icon in the page header. Clicking it reveals an inline "Are you sure?" confirmation panel directly below the header actions.
   - **Field Migration/Moving**: Users must be able to edit field details and migrate a field to another farm in their portfolio.
   - **Separate Navigation**: Split Farms and Fields into separate main menu items. The top-level Fields view (`/fields`) displays all fields in the portfolio.
   - **List Layout & Experience**: The fields list view must display a prominent, big "Add Field" button.
   - **Empty State**: When no fields exist, display a prominent, center-aligned empty state card with an icon, welcoming description, and a large "Add Field" button.
   - **Auto-Farm Creation (Beginner Flow)**: When a user creates their first field, if they have not yet created a farm, the system must automatically create a default farm named `"My Farm"` behind the scenes and associate the field with it. This ensures single-farm users do not need to navigate back and forth during initial setup.

4. **Security & Ownership Enforcement**
   - **Backend Verification**: The backend must enforce that users can only list, view, create, update, or delete farms, fields, and related agricultural entities (events, records, soil analyses, plans, applications, compliance breaches, sward movements) that they own.
   - User identity must be extracted dynamically from the `X-User-ID` header on the backend.


5. **Event Tracking**
   - Users must be able to describe and record events for each field.
   - **Supported Event Types**:
     - **Planting**: Crop type and variety.
     - **Fertiliser Application**: Product name, quantity, and N-P-K values.
     - **Sward Application**: Quantity, application method (LESSE vs Splash Plate), and nitrogen loading.
     - **Spraying**: **CRITICAL**: Must include MAPP number, EPPO crop code, and BBCH growth stage as per [PRD 0005](./0005-farm-sustainability-standards.md).
     - **Harvesting**: Yield quantity and quality notes.
     - **Tilling**: Method used (e.g., ploughing, min-till).
     - **Soil Analysis**: pH, P-index, K-index, and Magnesium levels.

## FE Requirements
- **User Profile**: Must be transitioned from the basic form to a premium "Hero-style" profile view as demonstrated in the prototype `HomeComponent`, utilizing the toggleable edit mode.
- **Farm/Field Cards**: Must utilize high-quality imagery (where available) and Bento-style layouts for displaying operational stats.
- **Timeline**: The field event tracking must use the standardized high-quality activity timeline identified in the FE review.
