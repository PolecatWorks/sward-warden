# Specification 0006-05: Inventory and Equipment Tracking Front-End

**State**: Complete

## 1. Overview
This specification details the front-end user interface components required for managing and visualizing slurry storage facilities, equipment fleets (with focus on LESSE compliance), and the digital chemical/pesticide inventory shelf.

## 2. Storage Visualization
- **Circular Gauges and Progress Charts**:
  - Slurry tanks and storage facilities must be displayed using circular SVG charts indicating percentage capacity used.
  - Color transitions:
    - `< 80%`: Neutral brand green (`hsl(116, 54%, 17%)`).
    - `80% - 90%`: Warning amber (`hsl(38, 92%, 50%)`).
    - `> 90%`: Critical danger red (`hsl(0, 75%, 45%)`).
  - Hover states on storage charts must show a tooltip containing exact volume metrics: `current_volume_m3` / `max_capacity_m3` and days of remaining buffer capacity.

## 3. Equipment Inventory Cards
- **LESSE Compatibility Indicators**:
  - Each item in the equipment inventory must be rendered as an interactive card.
  - A prominent badge must indicate whether the equipment supports Low Emission Slurry Spreading (LESSE).
  - Types:
    - **LESSE Compliant**: Trailing Shoe, Dribble Bar, Shallow Injector (Green badge with checkmark).
    - **Non-LESSE**: Splash Plate (Amber badge with exclamation icon).
  - Cards must toggle active/inactive status and track historical maintenance log shortcuts.

## 4. Digital Chemical Shelf
- **Categorization and Filtering**:
  - The pesticide and chemical database interface must resemble a clean, visual "digital shelf" dashboard.
  - Grouping: Items must be filtered by categories: Herbicides, Fungicides, Insecticides, Rodenticides, and Growth Regulators.
  - **Details Card**:
    - Product Name, MAPP Number, Active Ingredient list, expiry warning indicators.
    - Current stock quantity (litres/kg) represented by a vertical volume indicator bar.
    - Auto-warning text if a chemical has passed its regulatory use-by date or is slated for withdrawal.
