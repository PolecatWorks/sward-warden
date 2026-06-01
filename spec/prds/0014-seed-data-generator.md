# Product Requirements Document: Seed Data Generator

## Status
Complete

## 1. Introduction
The objective of this project is to create a developer-oriented tool that generates realistic, localised seed data for the Sward Warden be API and database. This tool will simplify development, testing, and demonstration by populating the database with representative data without requiring manual data entry.

## 2. Goals & Objectives
*   Provide a fast and repeatable way to populate the Sward Warden database with mock data.
*   Ensure the generated data conforms to the be API schema.
*   Use the existing API endpoints for data creation rather than writing directly to the database, ensuring that business logic and validation rules are respected.
*   Generate data that is specifically localised for a Northern Ireland agricultural setting (e.g., using realistic local farm names, town names, and crop types).
*   Ensure the tool is strictly for development and testing, and is not included in the production build artifacts.

## 3. Scope
**In Scope:**
*   A standalone Rust Command Line Interface (CLI) application located within the `tools` directory of the `sw-be-container` repository.
*   Integration with a data-faking library (e.g., `fake` crate) to generate realistic names, emails, and locations.
*   Integration with an HTTP client (e.g., `reqwest` crate) to interact with the Sward Warden be API.
*   Generation of hierarchical data sets: Users -> Farms -> Fields -> Events and Farm Records.
*   Configuration options for the API base URL and the amount of data to generate (e.g., number of farms).

**Out of Scope:**
*   A graphical user interface (GUI) for the seed data generator.
*   Inclusion of the tool in the main be production Docker image or release binaries.
*   Direct database manipulation (e.g., executing SQL `INSERT` statements).
*   Automatic execution of the tool as part of the production deployment pipeline.

## 4. Requirements

### 4.1. Functional Requirements
*   **REQ-1**: The tool must be a standalone Rust binary project.
*   **REQ-2**: The tool must communicate with the be API over HTTP to create resources.
*   **REQ-3**: The tool must support creating `User` records.
*   **REQ-4**: The tool must support creating `Farm` records associated with users.
*   **REQ-5**: The tool must support creating `Field` records associated with farms.
*   **REQ-6**: The tool must support creating `Event` records associated with fields (e.g., Planting, Fertiliser, Slurry Spreading).
*   **REQ-7**: The tool must support creating `FarmRecord` entries associated with farms.
*   **REQ-8**: The generated data must reflect Northern Ireland contexts (e.g., towns like "Ballymena", "Coleraine"; farm names reflecting local geography).
*   **REQ-9**: The tool must accept command-line arguments to specify the target API URL and the scale of data generation (e.g., the number of farms to create).

### 4.2. Non-Functional Requirements
*   **NFR-1 (Maintainability)**: The tool should be written in Rust to keep the toolchain consistent with the be repository.
*   **NFR-2 (Isolation)**: The tool must be organized in a way that prevents it from being compiled into the production binary (e.g., residing in a separate `tools/` directory and/or Cargo workspace).
*   **NFR-3 (Performance)**: The tool should perform the data generation process in a reasonable amount of time (e.g., less than 1 minute for a standard development dataset).

## 5. Technical Considerations
*   The `fake` and `rand` crates in Rust are suitable for generating the required randomized data.
*   The `reqwest` crate is suitable for making async HTTP requests to the be API endpoints.
*   Since the be API currently uses paths like `/v0/users` and `/v0/farms`, the tool must construct requests targeting these routes.
*   Error handling should be implemented to gracefully report issues if the be API is unreachable or returns errors during data creation.
