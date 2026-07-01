# Specification 0005-11: Reporting Center Front-End Components

**State**: Complete

## 1. Overview
This specification details the front-end components for the Reporting Center, including preview panels, download status visualizers, and dashboard widgets.

## 2. High-Fidelity Report Preview Layout
- Before downloading export archives (PDF/CSV/Excel), the user must be presented with an interactive, responsive preview panel:
  - **Grid Preview**: Top-level statistics (totals, average values, compliance breaches found).
  - **Tabular Data Preview**: Paginated preview of the report contents (e.g. spray event details for pesticide records or field nutrient balance calculations for fertilisation accounts).
  - **Warning Overlay**: If the report contains data that flags a compliance breach, overlay a warning card highlighting the specific fields and rules violated.

## 3. Export Progress Indicators
- For long-running export actions (such as generating annual GIS maps and complete spreadsheet records):
  - The export action must trigger a modal display.
  - A linear progress bar must visualize compile progress (e.g., `0% - 100%`).
  - Active steps must be textually output (e.g., "Compiling crop history...", "Generating PDF...", "Finalizing download packet...").
  - The download must trigger automatically via client-side file blob execution once the backend server completes packing.

## 4. Reporting Center Dashboard (Bento Grid)
- The main reporting screen utilizes a Bento grid architecture:
  - **Module 1 (Export Actions Card)**: Quick buttons to initiate annual reports (Pesticide Export, Fertilisation Account, Soil Analysis reports).
  - **Module 2 (Compliance Deadlines Card)**: Visual timeline of upcoming regulatory reporting deadlines with color indicators (Red for `< 30 days`, Amber for `< 90 days`).
  - **Module 3 (Archive Storage)**: Table listing previously generated report download files with creation dates and checksum verification icons.
