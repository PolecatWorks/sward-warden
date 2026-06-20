# Specification 0006-07: Storage Volume Prediction Model

## 1. Overview
This specification details the technical requirements for predicting the growth of volume within storage facilities over time and the mechanisms for manual calibration and auditing.

## 2. Storage Volume Prediction Model

The prediction model calculates the estimated volume of manure in a storage facility at a given point in time based on multiple contributing factors.

### 2.1 Animal Contribution
- **Calculation:** `Number of Animals * Baseline Daily Production Rate * Days Housed Indoors`.
- **Baseline Rates:** The system must maintain reference data for baseline daily production rates per animal type (e.g., dairy cow, beef cattle, pig, chicken).
- **Housing Duration:** The calculation must strictly apply only to periods when the animals are housed indoors and their waste is actively collected in the designated storage facility.

### 2.2 Environmental Factors (Rainfall)
- **Applicability:** Applies primarily to uncovered storage facilities (e.g., open lagoons, uncovered slurry tanks).
- **Calculation:** `Surface Area of Storage Facility * Rainfall Depth`.
- **Data Source:** Integrate with the weather API (specified in PRD 0008) to use recorded historical rainfall and predicted future rainfall to estimate the added volume.

### 2.3 Operational Factors
- **Wash-water:** Add fixed or estimated daily volumes from operational processes like dairy parlor wash-water.
- **Bulk Imports/Exports:** The model must adjust the total volume discretely based on logged import (adding volume) or export/spreading (reducing volume) events.

## 3. Volume Calibration and Auditing

To account for variances between predicted and actual volumes, the system must support manual calibration.

### 3.1 Manual Override
- **Functionality:** Users can manually input the observed actual volume (or depth) of a storage facility at a specific timestamp.
- **Adjustment:** The prediction model must use the latest manual calibration as the new baseline/starting point for future calculations.

### 3.2 Audit Log
- **Logging:** Every manual calibration event must be recorded in an audit log.
- **Data Captured:**
  - Timestamp of calibration.
  - User ID of the person making the calibration.
  - The manually entered volume.
  - The system-predicted volume at that exact timestamp (for variance tracking).
- **Purpose:** Analyzing the variance over time allows for refinement of the baseline prediction rates and helps users identify potential issues (e.g., unexpected water ingress or leaks).
