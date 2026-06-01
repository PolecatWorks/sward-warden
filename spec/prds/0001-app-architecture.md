# PRD 0001: Application Architecture

## Overview
This document defines the overarching application architecture for the sward management application, covering fe, be, and deployment strategies.

## Fe Requirements
- **Framework:** Angular
- **Layout Pattern:** Persistent shell layout using a `MainLayoutComponent` with nested `<router-outlet>` to ensure stable navigation (Header/BottomNav) across view transitions.
- **Design System:** Transition from generic Angular Material to a custom premium aesthetic using Tailwind CSS, Google Fonts (Work Sans), and curated HSL color palettes. Angular Material remains supported for low-level primitive components.
- **Location:** Code to be placed in `sw-fe-container` directory.
- **Deployment:** Packaged as a Docker container.
- **Runtime Configuration:** The fe must support dynamic configuration loading at startup. It should fetch a configuration JSON from the `assets` directory (e.g., `/assets/contents/app-config.json`) before bootstrapping. This allows the application to be configured at deployment time (e.g., via Kubernetes ConfigMaps mounted as volumes) without requiring a rebuild of the Docker image.

## Development Workflow
- All development actions will be triggered by `Makefile` targets.

## Be Requirements
- **Language/Framework:** Rust using the Axum web framework.
- **Location:** Code to be placed in `sw-be-container` directory.
- **Deployment:** Packaged as a Docker container.
- **State Management:** PostgreSQL for relational data storage.
- **Security:**
  - Authentication will be handled via **OAuth2 (OIDC)**, supporting providers like Google.
  - Endpoint protection and JWT validation will be managed by **Istio**.
  - The application will extract user identity from headers provided by the sidecar to associate data in the PostgreSQL database.
- **Data Sources (Initial Phase):**
  - Regulatory code lists (MAPP, EPPO, BBCH) will be implemented as static data.
  - Weather information will be provided via static datasets for the initial version, with future plans for API integration.
- **App Framework & CLI:**
  - Application configuration will be via YAML files, with secret files and environment variable overrides.
  - The application must follow 12-factor principles.
  - The application binary must feature CLI parsing with the following subcommands:
    - `serve`: Start the application server.
    - `version`: Display the application version.
    - `migrate`: Run schema migrations against the PostgreSQL database.
- **Networking:**
  - The application container will serve HTTP traffic on port 8080.
  - Liveness, readiness, startup, shutdown lifecycle, and health events will be served via HTTP on port 8079.
  - The primary Kubernetes Service exposes the be application traffic on port 80 (mapping to container port 8080).
  - The lifecycle port (8079) is not exposed on the Kubernetes Service; lifecycle and health checks can be performed directly on the pod IP.

## Deployment Requirements
- Both fe and be applications will be built as Docker containers.
- Deployment target is a Kubernetes cluster.
- Deployment configuration will be managed using Helm charts, which will reside in the `charts` directory.

## Testing Requirements
- **Integration Tests:** The application will use Robot Framework for integration testing.
  - Integration tests must verify the behavior of all be API endpoints.
  - The test suite must provide comprehensive coverage of "BREAD" operations (Browse, Read, Edit, Add, Delete) for all domain resources (Users, Farms, Fields, Events, Farm Records, Applications, Compliance Breaches, Sward Movements).
  - Where a specific be route (such as Edit, Read by ID, or Delete) is missing, tests must include explicit comments documenting the missing functionality.
