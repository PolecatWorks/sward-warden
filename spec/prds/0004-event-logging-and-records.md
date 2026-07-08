# PRD 0004: Event Logging & Spreading Records

## Overview
This document outlines the requirements for logging agricultural events (Planting, Fertiliser, Spraying, Organic Manure) and maintaining comprehensive spreading records to ensure compliance with Nutrients Action Programme (NAP) regulations. It consolidates PRD 0004 (Sward Spreading Records) and PRD 0019 (Field Event Logging UX and Validation).

## 1. Event Logging UX & Validation

### General Event Recorder
- **Record Event Form:** Clicking "Record Event" opens a form to select the Event Type (Planting, Fertiliser, Spraying, Organic Manure, Harvesting, Tilling, Other).
- **Dynamic Routing:** Selecting a specific type transitions to that specific form. "Other" or generic types default to Date and Description inputs.

### Form Validation & Visual Highlights
- **Save Button:** Must remain disabled until the form is completely valid.
- **Immediate Highlighting:** Required fields not completed must be immediately highlighted (e.g., red border, helper message) when the modal opens, without waiting for user interaction.

### Specific Event Forms
- **Planting Form:** Required: Date, Crop Type (e.g., Barley, Grass), Variety (e.g., Spring Barley '24). Optional: Description.
- **Fertiliser Application Form:** Required: Date, Fertiliser Type, Amount Applied (>0), Buffer Zone Confirmation checkbox.
- **Spraying (Pesticide) Form:** Required: Date, Product MAPP Number, EPPO Code, BBCH Growth Stage.
- **Organic Manure Form:** Required: Date, Manure Type, Soil/Weather Conditions Confirmation checkbox. *Conditional:* If Low Emission Equipment (LESSE) is *not* used, "Equipment Used" and "LESSE Exemption Reason" become required.

## 2. Spreading Records & Compliance (NAP)

### General Farm Records
- Must be prepared by 30 June each year and kept for five years.
- Include land controller identity, agricultural area, field sizes, locations, cropping regimes, livestock numbers, and rental agreements.

### Fertiliser Application Records
- Document the amount of each type of nitrogen fertiliser applied (including N content of organic manures).
- Retain evidence of the right to graze or control the area.

### Fertilisation Plan & Accounts
- **Plan:** A written fertilisation plan must be prepared by 1 March if operating under a nitrates derogation, applying chemical P to grassland, high-P manures, or anaerobic digestate.
- **Account:** Derogated farms must submit an annual fertilisation account online to the NIEA by 1 March.

### Import and Export Records
- Document written contractual agreements for manure movement.
- Track origin, destination, volume, and contract length.
- **Supported Materials:** Liquid slurry, solid dung, poultry litter, abattoir blood, anaerobic digestate.
- **Export Deadlines:** Submit to NIEA by 31 January (or 1 March for derogated farms).
- **FE Dashboard:** Provide a dedicated Bento-style overview to track manure movements and deadlines.

### Soil Analysis Results
- Required when applying P-rich organic manures (>0.25 kg total P per 1 kg total N) or anaerobic digestate to prove crop requirement for additional phosphorus.

## 3. User Journeys
The following user journeys validate event logging and compliance tracking:

- **Immediate Validation and Form UX Journey (`test_validation_flow.robot`)**: The integration testing suite must include an event logging validation journey. The journey must use the API to pre-create a farm and field, login to the UI, and navigate to the field's detail page. It must click the "Planting" quick action button, and verify that the "Log Planting" modal immediately shows red validation error borders on required fields (Crop Type and Variety) and disables the submit button. It must then fill the Crop Type field, confirm its red border is cleared while the submit button remains disabled, fill the Variety field, confirm its red border is cleared and the submit button is enabled, click Save, and verify the modal closes and the event appears in the timeline.
- **Sward Movement Creation Journey (`test_sward_movements.robot`)**: The integration testing suite must include an end-to-end sward movement journey. The journey must pre-create a parent farm via the API, log in to the UI, and navigate to the farm's sward movements page. It must select "export" type, fill in quantity, date, manure type, consignee details, and transporter name, and submit the form. It must verify the movement appears in the UI list and confirms via the backend API that the sward movement record is persisted.
