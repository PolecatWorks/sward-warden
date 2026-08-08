# PRD 0002: Frontend Foundations & UX Patterns

## Overview
This document defines the product requirements for the user interface and overarching UX patterns of the Sward Warden application. It consolidates global frontend requirements, responsive design strategies, home view layout, and accessibility features previously defined across multiple PRDs (0002, 0012, 0022, 0025).

## 1. Unified Home View (Command Center)
The application will centralize actionable information into a single "Home" view, eliminating fragmented "Dashboard" and "Compliance" tabs.

- **Daily Action Traffic Light:** A prominent visual indicator (Green/Yellow/Red) immediately communicating if it is safe/legal to spread slurry or take major actions today based on weather and compliance rules.
- **Critical Alerts Feed:** A prioritized list of immediate actions or warnings (e.g., buffer zones needed, approaching nitrogen limits).
- **Context-Aware Layout:**
  - *Single-Farm Users:* Display a consolidated list of critical field-level issues and upcoming tasks directly.
  - *Multi-Farm Users:* Display a summary of critical issues grouped by farm. Clicking a farm drills down into specific field issues.
- **Quick Links:** Bento-grid widgets summarizing inventory, upcoming events, and quick links to modules like Reporting.

## 2. Design & UX Patterns

### Premium Aesthetic
All user-facing modules must adhere to a premium design system:
- **Typography:** 'Work Sans' or similar modern sans-serif fonts.
- **Color Palette:** Curated HSL colors (e.g., `#154212` for primary, `#faf9f5` for surface) replacing generic Material themes.
- **Iconography:** Material Symbols Outlined with consistent weight/fill.

### Layout Patterns
- **Main Shell:** A persistent `MainLayoutComponent` housing the `TopAppBar` and `BottomNavBar`. Feature views render within a nested `<router-outlet>` to prevent layout jitter.
- **Bento Grid:** Used for dashboards and overviews to provide a modern, organized hierarchy.
- **Card-Based UI:** Minimalist cards with subtle shadows and rounded corners (at least `xl` or `2xl`).
- **Navigation Order:** Home, Fields, Farms, Inventory, Reporting.
- **Navigation State Visibility:** Navigation items must be visibly distinct based on availability. Available items must be fully visible (solid colors, full opacity), while unavailable modules (e.g., unsubscribed features) must remain in the UI but be styled in a greyed-out/disabled state, rather than being completely hidden.
- **Micro-Animations:** Subtle interactions (e.g., `scale-95` on active states, hover transitions).
- **Glassmorphism:** Bottom navigation bar with `backdrop-blur`.
- **Deletion Policy:** Deletion is only available from the edit form. It should not be possible to delete items unless you are on the edit view for that specific item.

## 3. Responsive Design
The application must scale gracefully across all device form factors (Mobile, Tablet, Desktop).

- **Adaptive Layouts:**
  - Tablet/Desktop grids (like the Bento grid) should reflow to display more columns.
  - Dashboards and forms must use multi-column layouts on wider screens to prevent excessively wide fields.
  - Implement a maximum content width (e.g., `max-w-7xl`) for readability.
- **Component Scaling:** Typography and touch targets must adjust across breakpoints using Tailwind responsive utility classes (`sm:`, `md:`, `lg:`, etc.).
- **Fluid Widths:** Avoid hardcoding fixed widths; use percentages or flex/grid layouts combined with `max-w` constraints.

## 4. Modal Keyboard Accessibility
All modal dialogs across the application must strictly adhere to the following keyboard accessibility rules:
- **Cancel:** Pressing the `Esc` key must close or cancel the modal.
- **Submit:** Pressing the `Enter` (or `Return`) key must submit the modal form.
- **Disabled State Protection:** The submit button (and the `Enter` key action) must remain disabled until a valid change has been made to the form data (dirty state).

## 5. Runtime Configuration Initialization & OIDC Authentication Flow
- The frontend must load `/assets/contents/app-config.json` via the `APP_INITIALIZER` pattern before bootstrapping.
- API base paths (`apiPath`), logging levels, telemetry configuration, and OIDC auth settings must be driven dynamically by this configuration injected via an `InjectionToken`.
- **OIDC Configuration & Realm Discovery:** The runtime configuration must support `auth` settings including `issuer` (e.g. `https://sw-dev.polecatworks.com/auth/realms/sw-dev`), `clientId`, and `redirectUri`. When bootstrapping, the OAuth service dynamically discovers authorization server endpoints using standard OIDC discovery (`.well-known/openid-configuration`) for the specified realm (such as `sw-dev`).
- **Unauthenticated Redirection to Auth Server:** When an unauthenticated user attempts to access protected routes, or when the application is initialized without a valid user token, the frontend (via route guards / auth services) must automatically redirect the user to the configured OIDC authentication server (e.g. Keycloak realm login page) via OIDC Authorization Code Flow.
- **Service Worker Auth & Discovery Exclusion:** Service worker navigation routing must explicitly bypass `/auth/**` paths (e.g., using `navigationUrls: ["/**", "!/auth/**", "!/api/**", "!/hams/**"]` in `ngsw-config.json`). This guarantees that Keycloak OIDC discovery (`.well-known/openid-configuration`) and login pages are always served directly by Keycloak rather than being intercepted by the Service Worker and served the Angular SPA `index.html`.
- **First-Time Login Profile Onboarding Flow:** Upon successful authentication via Keycloak, the application uses the Keycloak-provided user ID (the long string `sub` claim in the decoded JWT, e.g. `ae5245cd-3095-46db-8ce3-cea42fe26edf`) to attempt fetching the user profile from `GET /sward/v0/users/{userId}` (e.g. `https://sw-dev.polecatworks.com/sward/v0/users/ae5245cd-3095-46db-8ce3-cea42fe26edf`). If this request returns a `404 Not Found` (indicating the user has logged in for the first time and has no user record), the application must automatically navigate the user to an edit user screen. The form fields on this screen must be pre-populated with user details extracted directly from the decoded Keycloak JWT token claims where available (including `name`, `given_name`, `family_name`, `email`, and `preferred_username`), allowing the user to review, complete, and submit their profile details to register their user record in the application.

## 6. Sync Error Page & Graceful Recovery UX
When synchronization calls encounter an HTTP error response (specifically `403 Forbidden` or authorization errors), the frontend must prevent application failure or unintended resets by intercepting the error and routing to a dedicated **Sync Error Page** (`/error`):

- **Error Information Display:** Prominently display the HTTP status code (e.g. `403 Forbidden`) and clear diagnostic details indicating a synchronization permission or authorization failure.
- **Authenticated User Profile Context:** Display a dedicated identity card containing details of the currently logged-in user (e.g. User ID, Email/Username, and Active Roles) so the user can verify their active authentication context.
- **Retry Timer & Visual Progress Bar:** Render an interactive countdown timer paired with an animated progress bar indicating the exact time remaining before the next automatic sync retry attempt.
- **Automatic & Manual Sync Retry:** When the countdown timer reaches zero (or if the user manually clicks "Retry Sync"), re-trigger the sync request.
- **Seamless Application Resumption:** If the retried sync returns a successful response (`200 OK`), immediately clear the sync error state and navigate back to resume normal application usage without requiring manual page reload or login re-entry.
