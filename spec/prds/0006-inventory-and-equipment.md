# PRD 0006: Inventory and Equipment Tracking

## Overview
This document outlines the requirements for tracking inventory and equipment. Maintaining an accurate inventory of storage capacities, chemical products, and equipment types is critical for compliance with environmental regulations (e.g., Farm Sustainability Standards).

## Inventory Scope & Ownership
- **Portfolio-Level Ownership**: Inventory and equipment records are independent of a single farm. They belong to the user's overall portfolio/account.
- **Farm Association**: Although owned at the portfolio level, individual inventory items (e.g., equipment, chemical batches, or storage facilities) can be associated with specific farms or shared across multiple farms as needed.

## Key Requirements

1. **Storage Capacity Tracking**
   - Track livestock manure storage capacities (minimum 22 weeks for most enterprises, 26 weeks for pig/poultry enterprises).
   - Track distinct types of storage facilities, including:
     - **Liquid Storage**: Slurry tanks, lagoons, wash-water tanks.
     - **Solid Storage**: Dung heaps, poultry litter stores, solid manure pads.
   - Differentiate between covered and uncovered storage facilities.
   - Track other chemical and organic fertiliser storage limits and current capacities.

2. **Storage Volume Prediction Model**
   - Provide a mechanism to predict the growth of volume within storage facilities over time.
   - **Animal Contribution**: Calculate volume increases based on animal type (e.g., dairy cows, beef cattle, pigs, chickens). The calculation must multiply the number of animals by a baseline daily production rate. Importantly, this contribution should *only* be calculated for the duration animals are housed indoors.
   - **Environmental Factors**: For uncovered storage facilities (like open lagoons), the prediction model must factor in expected or recorded rainfall, which adds to the total volume.
   - **Operational Factors**: The model must account for additional liquid inputs, such as dairy parlor wash-water, as well as discrete bulk import events (e.g., importing abattoir blood or dung).

3. **Volume Calibration and Auditing**
   - Allow users to manually override and set the current actual volume of a storage facility at any point in time.
   - Maintain a historical audit log of these manual calibrations. This log allows the system and the user to compare predicted volumes against actual measurements, enabling future refinement and calibration of baseline prediction rates.

4. **Chemical and Pesticide Inventory**
   - Record and maintain an inventory of Plant Protection Products (PPPs).
   - Track specific data points: Product Authorization Number (MAPP).
   - Provide visibility into available quantities to facilitate accurate event tracking.

5. **Equipment Tracking**
   - Record farm equipment details, specifically focusing on Low Emission Sward Spreading Equipment (LESSE) such as dribble bars, trailing shoes, and soil injection systems.
   - Record exceptions, like inverted splash plates, and the justification (e.g., impractical due to field slope).

6. **Import/Export Contracts**
   - Document written contractual agreements for manure movement onto or off the farm.
   - Track origin, destination, volume, and contract length for compliance reporting.

## FE Requirements
- **Storage Visualization**: Sward storage levels should be visualized using high-quality progress bars or circular gauges that match the premium dashboard aesthetic.
- **Equipment Inventory**: Use the premium card-based FE to display equipment details, highlighting LESSE compatibility and active statuses.
- **Digital Shelf**: The pesticide inventory should be presented as a "digital shelf" with clear categorization and easy access to MAPP details.
