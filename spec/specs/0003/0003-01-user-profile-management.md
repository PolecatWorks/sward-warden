# 0003-02 User Profile Management Specification

**State**: Complete

## Scope
This specification covers the implementation details of user profile management as outlined in PRD 0003.

## Features
- **OAuth2 Identity Linkage**: Link user profiles directly to external authentication providers (Google/OAuth2 identity tokens). The profile model must store `oauth_provider` and `oauth_subject_id` to map authenticated sessions.
- **Post-Login Onboarding Flow**:
  - New users must be redirected to a dedicated profile setup step immediately after their first successful login.
  - The application must restrict access to other areas (e.g. Dashboard) until the user provides profile details (Name, Contact Email, Phone, Preferred Region).
- **Profile UI/UX Guidelines**:
  - **Hero-Style Profile Header**: A modern profile screen with a prominent banner, high-quality user avatar, and quick stats summary cards (e.g., number of farms managed, total area).
  - **Bento-Style Operational Cards**: Profile dashboard uses bento-grid modules to segregate contact details, linked credentials, organization settings, and active farm contexts.
  - **Activity Timeline**: Incorporate a high-quality activity log showing the user's audit history (last logins, updates to farms/fields) styled as a vertical timeline.

## Data Model Requirements
- Update `Users` entity to support:
  - `oauth_provider` (VARCHAR)
  - `oauth_subject_id` (VARCHAR)
  - `onboarding_completed` (BOOLEAN, default false)
  - `phone` (VARCHAR)
  - `preferred_region` (VARCHAR)
