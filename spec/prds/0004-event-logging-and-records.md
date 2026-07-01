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
