# 0005-01 Spraying (Pesticide Use) Records Specification

**State**: Complete

## Scope
This specification covers the implementation details for Spraying (Pesticide Use) Records under the Farm Sustainability Standards (FSS) as outlined in PRD 0005.

## Features
- Implement machine-readable digital record keeping for Plant Protection Products (PPPs).
- Require three specific fields per entry starting in transition year 2026:
  - Product authorisation number (MAPP). MAPP stands for Ministerial Approved Pesticide Product. In the UK, it is a unique registration number assigned to approved pesticides to confirm they are legally authorized for use and trackable.
  - Relevant EPPO crop or land-use code. EPPO refers to the European and Mediterranean Plant Protection Organization. EPPO codes are standard alphanumeric identifiers used globally in agriculture to precisely record specific plant species, crops, or pests, eliminating confusion caused by different common names or languages.
  - BBCH growth-stage code. BBCH is a universally recognized scale used in agronomy to identify the exact phenological development (growth) stages of a plant. The scale uses a uniform numbering system to describe how far along a crop is in its life cycle, such as germination, leaf development, or flowering.
- Capability to export/transfer records electronically to authorities (e.g., DAERA) by 2027 deadline.

## Data Model Requirements
- Extend event schemas to capture specific details required for PPPs (MAPP, EPPO, BBCH).
