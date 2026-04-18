# 0001-01 Frontend Specification

## Scope
This specification covers the implementation details of the frontend application as outlined in PRD 0001.

## Technical Stack
- **Framework**: Angular
- **UI Component Library**: Angular Material
- **Location**: All source code will reside in `sp-fe-container/`

## Deployment Strategy
- The application will be packaged into a Docker container.

## Expected Workflows
- TDD should be practiced, prioritizing component tests, service tests, and e2e specifications.
- Development processes (e.g., install, build, test) will be managed through `Makefile` targets.