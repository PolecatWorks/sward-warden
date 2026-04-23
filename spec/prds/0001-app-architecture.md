# PRD 0001: Application Architecture

## Overview
This document defines the overarching application architecture for the slurry management application, covering frontend, backend, and deployment strategies.

## Frontend Requirements
- **Framework:** Angular
- **Layout Pattern:** Persistent shell layout using a `MainLayoutComponent` with nested `<router-outlet>` to ensure stable navigation (Header/BottomNav) across view transitions.
- **Design System:** Transition from generic Angular Material to a custom premium aesthetic using Tailwind CSS, Google Fonts (Work Sans), and curated HSL color palettes. Angular Material remains supported for low-level primitive components.
- **Location:** Code to be placed in `sp-fe-container` directory.
- **Deployment:** Packaged as a Docker container.

## Development Workflow
- All development actions will be triggered by `Makefile` targets.

## Backend Requirements
- **Language/Framework:** Rust using the Axum web framework.
- **Location:** Code to be placed in `sp-be-container` directory.
- **Deployment:** Packaged as a Docker container.
- **State Management:** PostgreSQL for relational data storage.
- **Security:** Security, authentication, and authorization logic will be deferred to Istio in the Kubernetes cluster.
- **App Framework & CLI:**
  - Application configuration will be via YAML files, with secret files and environment variable overrides.
  - The application must follow 12-factor principles.
  - The application binary must feature CLI parsing with the following subcommands:
    - `serve`: Start the application server.
    - `version`: Display the application version.
    - `migrate`: Run schema migrations against the PostgreSQL database.
- **Networking:**
  - The application will serve HTTP traffic on port 8080.
  - Liveness, readiness, startup, shutdown lifecycle, and health events will be served via HTTP on port 8079.

## Deployment Requirements
- Both frontend and backend applications will be built as Docker containers.
- Deployment target is a Kubernetes cluster.
- Deployment configuration will be managed using Helm charts, which will reside in the `charts` directory.
