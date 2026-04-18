# PRD 0001: Application Architecture

## Overview
This document defines the overarching application architecture for the slurry management application, covering frontend, backend, and deployment strategies.

## Frontend Requirements
- **Framework:** Angular
- **Component Library:** Angular Material
- **Location:** Code to be placed in `sp-fe-container` directory.
- **Deployment:** Packaged as a Docker container.

## Backend Requirements
- **Language/Framework:** Rust using the Axum web framework.
- **Location:** Code to be placed in `sp-be-container` directory.
- **Deployment:** Packaged as a Docker container.
- **State Management:** PostgreSQL for relational data storage.
- **Security:** Security, authentication, and authorization logic will be deferred to Istio in the Kubernetes cluster.
- **App Framework & CLI:**
  - Application configuration will be via YAML files.
  - The application must follow 12-factor principles.
  - The application binary must feature CLI parsing with the following subcommands:
    - `serve`: Start the application server.
    - `version`: Display the application version.
    - `migrate`: Run schema migrations against the PostgreSQL database.

## Deployment Requirements
- Both frontend and backend applications will be built as Docker containers.
- Deployment target is a Kubernetes cluster.
- Deployment configuration will be managed using Helm charts, which will reside in the `charts` directory.
