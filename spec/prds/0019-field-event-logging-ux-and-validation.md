# PRD 0019: Field Event Logging UX and Validation

## Overview
This document defines the product requirements for logging agricultural events (Planting, Fertiliser, Spraying, Organic Manure, and general events) on the Field Details page. It details form validation, visual error highlighting, and the introduction of a Planting form and a general Event logging interface.

## Key Features

1. **Form Validation & Visual Highlights**
   - **Requirement**: Save buttons in all event forms must be dimmed/disabled until the form is completely viable (valid) to be submitted.
   - **Behaviour**: Any required fields that are not completed or violate constraints must be highlighted (e.g., with a red border and helper message) to make it clear that they need to be filled in. This visual highlighting and corresponding error messages must be shown immediately when the form modal or section is opened/rendered, without waiting for the user to touch/interact with the field or submit the form.
   - **Target Forms**:

     - **Fertiliser Application Form**: Required fields: Date, Fertiliser Type, Amount Applied (must be > 0), and Buffer Zone Confirmation checkbox (must be checked).
     - **Spraying (Pesticide) Form**: Required fields: Date, Product MAPP Number, EPPO Code, and BBCH Growth Stage.
     - **Organic Manure Form**: Required fields: Date, Manure Type, and Soil/Weather Conditions Confirmation checkbox (must be checked). Additionally, if Low Emission Equipment (LESSE) is *not* checked/applied, the "Equipment Used" and "LESSE Exemption Reason" fields become required.

2. **Planting Form Integration**
   - **Requirement**: The "Planting" quick action button must open a dedicated Planting Form modal.
   - **Fields**:
     - **Date** (required)
     - **Crop Type** (required, e.g. Barley, Wheat, Grass)
     - **Variety** (required, e.g. Spring Barley '24)
     - **Description / Notes** (optional)
   - **Behaviour**: Standard validation and visual highlights apply. Submitting the form logs a new 'Planting' event for the field.

3. **General Event Recorder**
   - **Requirement**: Clicking the main "Record Event" CTA button must open a "Record Event" form.
   - **Behaviour**: The form must allow the user to select the **Event Type** (e.g., Planting, Fertiliser, Spraying, Organic Manure, Harvesting, Tilling, Other).
   - **Routing**: If the user selects one of the specific event types (Planting, Fertiliser, Spraying, Organic Manure), the UI must transition to show the corresponding specific form. If they select another type (e.g., Harvesting, Tilling, Other), the form displays generic inputs (Date, Description) to log the event.
