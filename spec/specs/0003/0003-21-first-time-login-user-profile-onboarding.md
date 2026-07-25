# Spec 0003-21: First-Time Login User Profile Onboarding

## Status
Open

## Target PRD
PRD 0003, PRD 0002

## Overview
This specification details the technical requirement and frontend behavior for handling a user's first login via Keycloak OIDC authentication. When a user authenticates, their Keycloak user ID (string UUID from the JWT `sub` claim) is used to verify profile existence. If the profile request returns a `404 Not Found`, the application automatically navigates the user to an edit user profile screen pre-populated with details extracted from the decoded Keycloak JWT token.

## Requirements

### 1. Keycloak User Identity Extraction
- The frontend authentication service decodes the Keycloak OIDC JWT token upon login.
- The unique user identifier is derived from the JWT `sub` claim as a string UUID (e.g., `ae5245cd-3095-46db-8ce3-cea42fe26edf`).

### 2. First-Time Profile Verification (`GET /sward/v0/users/{userId}`)
- Upon initial authentication, the application attempts to fetch the user profile from `GET /sward/v0/users/{userId}` (e.g., `https://sw-dev.polecatworks.com/sward/v0/users/ae5245cd-3095-46db-8ce3-cea42fe26edf`).
- If the backend returns `200 OK`, the user profile exists, and standard application initialization completes.
- If the backend returns `404 Not Found` (or error indicating no user record exists), the application flags the session as a first-time login onboarding state.

### 3. Edit User Screen Navigation
- Upon detecting a `404 Not Found` during profile lookup, the application automatically redirects/navigates the user to the Edit User Profile view/form.
- The user is prevented from navigating to main application features until their profile details are submitted and created.

### 4. JWT Claim Form Pre-Population
- The Edit User Profile form fields must be pre-populated using decoded claims from the Keycloak JWT token:
  - **Full Name**: Derived from `name`, or concatenated `given_name` and `family_name`, or `preferred_username`.
  - **Email**: Derived from `email`.
  - **Username / Identifier**: Derived from `preferred_username`.
- The user can inspect, modify, or add missing details (such as phone number or description).

### 5. Profile Submission & Registration
- Submitting the Edit User form issues a request (`POST /sward/v0/users` or `PUT /sward/v0/users/{userId}`) containing the user ID and updated profile data.
- Upon successful creation (`200 OK` or `201 Created`), the onboarding state is cleared, and the application resumes normal navigation to the Home command center.
