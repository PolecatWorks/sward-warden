# 0003-05 Event Tracking Specification

**State**: Complete

## Scope
This specification covers the implementation details of event tracking as outlined in PRD 0003.

## Features
- Record events for each field, including:
  - Planting
  - Fertiliser application
  - Sward application
  - Spraying
  - Harvesting
  - Tilling
  - Other relevant agricultural activities.

## Data Model Requirements
- Create `Events` entity.
- Support relationship for Many Events per Field.
