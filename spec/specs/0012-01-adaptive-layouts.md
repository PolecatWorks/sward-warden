# Spec 0012-01: Adaptive Layouts

## 1. Description
This specification details the implementation of adaptive layouts across mobile, tablet, and desktop viewports, as derived from PRD 0012. The goal is to ensure the UI gracefully scales to utilize available screen real estate effectively without compromising readability or usability.

## 2. Acceptance Criteria
1. **Mobile Layout (`< 640px` / default Tailwind classes)**:
   - The UI must continue to use the existing mobile-first layout.
   - Core layouts like forms and data grids should stack vertically into a single column.
   - The primary navigation remains as a bottom navigation bar.
2. **Tablet Layout (`sm:` to `md:` / `>= 640px`)**:
   - The layout must begin adapting to wider screens.
   - Grid layouts (such as Bento grids used in dashboards) should reflow from a single column to display 2 or more columns.
   - Touch targets must remain adequately sized.
3. **Desktop Layout (`lg:` and up / `>= 1024px`)**:
   - The UI must fully utilize desktop screen width using multi-column layouts for dashboards and data entry forms.
   - Text fields and form inputs must not stretch the full width of the screen; they must be constrained within multi-column grids or restricted container widths.
   - A maximum content width constraint (e.g., Tailwind's `max-w-7xl` or similar) must be applied to the main content container to prevent infinite stretching on ultra-wide monitors.
4. **Desktop Navigation Adaptation**:
   - The application navigation must adapt for desktop viewports.
   - The mobile bottom navigation must be hidden.
   - A sidebar navigation (left-aligned) or a prominent top navigation bar must be displayed in its place, providing a more standard desktop app experience.

## 3. Implementation Steps
1. Add a wrapper container in the main application layout file (e.g., `app.component.html` in the Angular frontend) applying the max-width constraint (e.g., `<div class="mx-auto max-w-7xl w-full">`).
2. Update dashboard components to use Tailwind grid utilities like `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or `flex-wrap` properties to ensure cards and data widgets reflow.
3. Refactor major data entry forms to use multi-column grids on larger screens (e.g., using `grid md:grid-cols-2 gap-4`).
4. Implement a responsive navigation component that conditionally renders a bottom nav using `block lg:hidden` and a sidebar/top nav using `hidden lg:flex` (or similar utility combinations).

## 4. State
Open
