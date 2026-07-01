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
- **Micro-Animations:** Subtle interactions (e.g., `scale-95` on active states, hover transitions).
- **Glassmorphism:** Bottom navigation bar with `backdrop-blur`.

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

## 5. Runtime Configuration Initialization
- The frontend must load `/assets/contents/app-config.json` via the `APP_INITIALIZER` pattern before bootstrapping.
- API base paths (`apiPath`), logging levels, and telemetry configuration must be driven dynamically by this configuration injected via an `InjectionToken`.
