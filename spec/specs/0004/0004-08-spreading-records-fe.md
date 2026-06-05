# Specification 0004-08: Spreading Records Front-End Components

**State**: Complete

## 1. Overview
This specification details the front-end user interface components required for organic spreading (slurry and manure) record entry, organic imports/exports tracking, and equipment exemption logging.

## 2. Record Entry Form UX
- **Mobile First & Large Touch Targets**:
  - The record creation form must feature buttons, selectors, and input fields with a minimum tap target of **48x48px**.
  - Dropdowns for select fields (Field selection, Application Method, Equipment Type) must use large text and support autocomplete searching.
- **Dynamic Unit Validation**:
  - Automatically calculate and display calculated values (e.g. total volume based on application rate and field size).
  - Highlight values exceeding standard thresholds with warning indicators prior to submission.
- **Iconography**:
  - Use `Material Symbols Outlined` icons to visually differentiate manure types (e.g., slurry vs. farmyard manure) and application methods.

## 3. Bento-Style Import/Export Dashboard
- The application will feature a dedicated organic import/export tracker module styled as a bento grid component on the Records dashboard:
  - **Module 1 (Manure Balance Card)**: Displays current net imported/exported nitrogen vs annual limits.
  - **Module 2 (Upcoming Deadlines)**: Lists regulatory submission dates (e.g. annual organic manure movement reports).
  - **Module 3 (Active Contracts)**: A list of approved organic manure import/export transactions with quick links to download signed contract documents.

## 4. Exemption Logging Component
- For users utilizing splash plate application methods under regulatory exceptions, the UI must provide a dedicated exemption logger:
  - **Input Fields**: Exemption Reason (text), Start Date (date), End Date (date), and spreading equipment detail.
  - **Document Uploader**: A drag-and-drop file upload component allowing users to upload supporting evidence (PDF, JPEG, PNG, max 10MB) such as contractor certifications or regulatory permits.
  - **Exemption Banner**: High-visibility warning banner in the event entry screen notifying the user when they are recording a splash plate application that does not have an active, verified exemption logged.
