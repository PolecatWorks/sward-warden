# 0004-02 General Farm Records Specification

**State**: Open

## Scope
This specification covers the general farm records required to maintain compliance with NAP regulations (PRD 0004).

## Features
- System support to log and store general farm records annually (by 30 June).
- Data points include: land controller identity, agricultural area, field sizes, locations, cropping regimes.
- Record livestock details (numbers, species, time kept), manure storage capacity, and off-farm rental storage agreements.
- Records must be stored securely and retained for a minimum of five years.

## Data Model Requirements
- Entity for `FarmRecords`.
- Appropriate foreign key relations to `Farms` and `Fields`.
- Timestamping to support five-year retention policies.