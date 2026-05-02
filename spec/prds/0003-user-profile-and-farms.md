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

3. **Field Management**
   - Within each farm, users must be able to create and manage multiple fields.

4. **Event Tracking**
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
