# PRD 0005: Sustainability, Compliance & Reporting

## Overview
This document outlines the strict environmental standards, compliance tracking, and reporting capabilities required by the application under the Farm Sustainability Standards (FSS) and Nutrients Action Programme (NAP). It consolidates requirements previously spread across PRD 0005 (Sustainability Standards) and PRD 0007 (Reporting and Export).

## 1. Compliance and Regulatory Standards

### Spraying (Pesticide Use)
- **Digital Records:** Plant Protection Products (PPPs) records must be maintained in a machine-readable digital format for electronic submission.
- **Required Fields:** Every PPP entry must include the product authorization number (MAPP), EPPO crop/land-use code, and BBCH growth-stage code.
- **Transition Period:** Professional users are expected to begin recording the three new digital fields during the 2026 transition year grace period, with full electronic transfer compliance mandatory from 1 January 2027 (ultimately converting any remaining paper records to the required digital format in time).

### Chemical Fertiliser
- **Closed Spreading Periods:** Prohibited between 15 September and 31 January for grassland.
- **Urea & Nitrogen Limits:** Granular urea is prohibited unless containing a urease inhibitor. N limits are dictated by farm type and expected dry matter yield.
- **Phosphorus Restrictions:** Chemical P fertilisers can only be applied if recent soil analysis demonstrates crop requirement.

### Sward and Organic Manure
- **Loading Limits:** Total livestock manure application must not exceed 170 kg N/ha/year. Derogated farms can apply up to 250 kg N/ha/year but have strict planning rules.
- **Closed Periods:** Sward/poultry litter/digestate (15 Oct - 31 Jan). Farmyard manure (31 Oct - 31 Jan).
- **Weather Limits:** Spreading is prohibited if soil is waterlogged, flooded, frozen, snow-covered, or if heavy rain is falling/forecast within 48 hours.
- **Application Limits:** Max application of 50m³ (4,500 gallons) of sward or 50 tonnes of solid manure per hectare at once, with a minimum of 3 weeks between applications.
- **LESSE Requirements:** Low Emission Sward Spreading Equipment is legally required for contractors, digestate spreading, cattle farms with 200+ livestock units, pig farms producing 20,000kg+ of nitrogen, and derogated farms after 15 June.
  - *Exemptions:* Splash plates permitted if field slope makes LESSE impractical, provided the field and reason are recorded.

## 2. Audit Penalty Matrix
Infractions against the Farm Sustainability Standards trigger financial penalties:
- **Very Low Severity:** Warning letter.
- **Low Severity:** 1% penalty or £50 (whichever is higher), along with a guidance letter explaining the breach.
- **Very High Severity:** 50% penalty or £2,100 (whichever is higher), along with a guidance letter, up to complete payment loss and exclusion from support schemes.
- **Mandatory Training:** Required for any breach.
- **Repeat Breaches:** If a business breaches the same requirement within a 3-year period, the financial penalties increase.

## 3. Reporting and Data Export
The application must generate the following reports for authorities (e.g., DAERA, NIEA):

- **Digital Pesticide Records:** Export PPP application records in a machine-readable format containing MAPP, EPPO, and BBCH codes.
- **Annual Fertilisation Accounts:** Summary for derogated farms formatted for online submission by 1 March.
- **General Farm Records:** A comprehensive export (to be prepared by 30 June) detailing agricultural area, livestock, cropping regimes, and field locations.
- **Soil Analysis Reports:** Documentation demonstrating crop requirements for P-rich manures or chemical phosphorus.
- **Import/Export Records:** Records of sward/manure movements to be submitted annually (by 31 January or 1 March for derogated).

## 4. FE Requirements for Compliance & Reporting
- **Exemption Logging UX:** A frictionless component to quickly log splash plate exemptions.
- **Interactive Alerts:** Compliance warnings use high-visibility Material Symbols and clear tonal color coding (Error/Warning containers).
- **Regulation Visualization:** Closed periods, nitrogen limits, and upcoming deadlines must be visualized using the Bento grid pattern on the Reporting Center and Home views.
- **Risk Assessment Mapping:** Vulnerable zones must be clearly rendered on field maps following the premium design system.
- **Report Preview:** High-fidelity, clean layout previews before exporting, with clear visual feedback during the data generation/download process.
