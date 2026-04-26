# 0001-01 Frontend Specification

**State**: Complete

## Scope
This specification covers the implementation details of the frontend application as outlined in PRD 0001.

## Technical Stack
- **Framework**: Angular (specifically requested for the UI)
- **UI Component Library**: Angular Material (specifically requested for the UI)
- **Location**: All source code will reside in `sw-fe-container/`

## Deployment Strategy
- The application will be packaged into an nginx container serving the compiled json statically.

## Expected Workflows
- TDD should be practiced, prioritizing component tests, service tests, and e2e specifications.
- Development processes (e.g., install, build, test) will be managed through `Makefile` targets.
