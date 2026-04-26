# Spec 0013-01: Administration Console Application Setup

## Status: Complete

## 1. Overview
As per PRD 013, the Administration Console must be a separate interface from the main user-facing product. This specification details the setup of a new frontend application/container dedicated to administrative and support tasks.

## 2. Requirements
- Create a new Angular application (or a separate module within the existing monorepo structure if applicable, but deployed independently).
- Ensure the admin console has its own routing and layout.
- Configure build and deployment scripts (Makefile) to handle the new admin frontend.
- Implement a basic shell with a sidebar for navigation between administrative sections (Users, Support Views, Audit Logs).

## 3. Technical Details
- **Framework**: Angular (matching existing stack).
- **Project Structure**: New directory `sw-admin-container` similar to `sw-fe-container`.
- **Navigation**: Sidebar with links to:
  - Dashboard
  - User Management
  - Support Entity Explorer
  - Audit Logs
- **Styling**: Distinct theme (e.g., darker sidebar or different primary color) to differentiate from the user app.

## 4. Tasks
- [ ] Initialize `sw-admin-container` project.
- [ ] Add basic routing and layout.
- [ ] Update root `Makefile` with `sw-admin-dev`, `sw-admin-test`, and `sw-admin-docker` targets.
- [ ] Ensure local proxy/cors configuration matches the backend API.
