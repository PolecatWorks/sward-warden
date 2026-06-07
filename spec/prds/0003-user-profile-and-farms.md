# PRD 0003: User Profile and Farms

## Overview
This document defines the requirements for user profiles and the management of farms, fields, and agricultural events within the application.

## Key Features

1. **User Profile Management**
   - Provide a user interface to allow users to set and manage their profile information.
   - Profile information is linked to the user's **OAuth2 identity** (e.g., Google account).
   - Users typically complete their profile details (contact info, etc.) during an onboarding step after their first successful login.

2. **Farm Management**
   - Once joined, users must be able to create and manage multiple farms within their account.
   - **Risky Delete Protection**: A farm cannot be deleted from the list view. Deletion is only accessible from a dedicated Farm Details page (`/farms/:farmId`), requiring explicit inline confirmation (not a modal).
   - **Safe Farm Deletion**: Farm deletion must block if there are any active (non-deleted) fields belonging to the farm. Users must migrate or delete the fields first. Enforced on both frontend (disabled state + warning) and backend (HTTP 400 rejection).

3. **Field Management**
   - Within each farm, users must be able to create and manage multiple fields.
   - **Field Migration/Moving**: Users must be able to edit field details and migrate a field to another farm in their portfolio.
   - **Separate Navigation**: Split Farms and Fields into separate main menu items. The top-level Fields view (`/fields`) displays all fields in the portfolio.

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
- **User Profile**: Must be transitioned from the basic form to a premium "Hero-style" profile view as demonstrated in the prototype `HomeComponent`.
- **Farm/Field Cards**: Must utilize high-quality imagery (where available) and Bento-style layouts for displaying operational stats.
- **Timeline**: The field event tracking must use the standardized high-quality activity timeline identified in the FE review.
