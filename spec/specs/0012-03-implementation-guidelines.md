# Spec 0012-03: Responsive Design Implementation Guidelines

## 1. Description
This specification details the technical guidelines and testing requirements for implementing responsive design across the application, adhering to the principles outlined in PRD 0012.

## 2. Acceptance Criteria
1. **Utility-First Approach**:
   - All responsive styling must utilize Tailwind CSS's responsive utility classes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`). Custom media queries in CSS should be avoided unless strictly necessary for edge cases not covered by Tailwind.
2. **Fluid Widths**:
   - The application must prioritize fluid widths (using percentages like `w-full`, `w-1/2` or flex/grid layouts) over hardcoded fixed widths (e.g., avoiding `w-[500px]`).
   - Fixed widths should only be used in combination with maximum width constraints (`max-w-`) to prevent layout breakage on smaller screens.
3. **Comprehensive Testing**:
   - Responsive behavior must be verified across all major views, specifically including:
     - The main Dashboard.
     - Farm and Field Management views.
     - Event Tracking forms and lists.
     - Inventory Management views.
   - Testing must cover mobile, tablet, and desktop viewports to ensure no horizontal scrolling or overlapping content occurs unexpectedly.

## 3. Implementation Steps
1. Establish a linting rule or code review checklist to catch and flag the use of hardcoded pixel widths in template classes where fluid utilities should be used instead.
2. Integrate responsive testing into the local development workflow, potentially utilizing browser developer tools to simulate different device sizes.
3. Update end-to-end testing frameworks (if present) to execute key UI tests across multiple viewport sizes (e.g., mobile viewport vs. desktop viewport configuration).

## 4. State: Complete
