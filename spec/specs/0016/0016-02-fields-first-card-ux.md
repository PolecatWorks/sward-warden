# Specification 0016-02: Fields-First UX Redesigned Field Cards

**State**: Complete

## Overview
This specification details the UI/UX enhancement to align the look and feel of the Field cards within the "Fields" view on the "Farms and Fields" page with the Farm cards. The goal is to provide a more intuitive, visually appealing, and consistent card layout where clicking anywhere on the card navigates directly to the field details page, and where a fallback image is used when no field-specific image is provided.

## Requirements

1. **Card Visual Redesign (All Fields list):**
   - The Field cards under the "All Fields" view on the `farms` page (managed by `FarmsComponent`) shall be styled consistently with the Farm cards.
   - The card structure must feature a top image header and a bottom metadata drawer.
   - Layout classes:
     - Outer Card: `bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group`
     - Top Image Container: `h-40 relative`
     - Bottom Drawer: `p-4 flex justify-between items-center bg-surface-container-low`

2. **Image Header and Fallback:**
   - The top header must display the field's image if `field.image_url` is defined.
   - If no image URL is provided (i.e. `field.image_url` is undefined or falsy), the card must display a default high-quality agricultural field image:
     - Default image URL: `https://lh3.googleusercontent.com/aida-public/AB6AXuA7EvfTSsCw8OGvjryP0rv1kkjm5LiiMnI95khqUCyK_rCgHYbzOQtA0UvTb0mqdhGrD7fqXjSr7mGxhxBTbg83OlwRVfczJS08yqnGBP7ZnL40wdU6vn2nuP8TrjtTrk7M0gwseY0p3EG-e3Y7bmAS8b93iwes2nN5wyKmf6UXrGO6EKG5oOPjUkN8EsKXXkjWnRRduaBbG3qfRv15jMsmqXw2k8sA-LcZu5ho-092GoItC8gBbOQXwV6XnG8XBUI_Pdl3TEpofQ`
   - A gradient overlay must be applied on the image: `bg-gradient-to-t from-black/60 to-transparent`.
   - Text overlay at the bottom left:
     - Heading: Field Name (`field.name`), using selector `[data-testid="field-name"]`.
     - Subtitle (only for multi-farm users): Farm name (`Farm: {{ getFarmName(field.farm_id) }}`), using selector `[data-testid="field-farm"]`.

3. **Bottom Metadata Drawer:**
   - Display a row of key statistics:
     - **Area**: `field.area_hectares` with selector `[data-testid="field-area"]` (labeled "Area").
     - **Crop**: `field.land_use || 'Grassland'` with selector `[data-testid="field-landuse"]` (labeled "Crop: <value>").
     - **Last Activity**: `getLastActivityDate(field.id)` with selector `[data-testid="field-activity"]` (labeled "Last Activity").
   - Display a right-aligned chevron icon (`chevron_right`) to indicate clickability.

4. **Card-wide Interactivity:**
   - Both the top image container and the bottom drawer must be wrapped in/associated with a router link pointing to `['/fields', field.id]`.
   - Clicking anywhere on the card (except for potential future propagation-stopping buttons) must navigate to the field's detail page.
   - The separate "Details" button must be replaced by this overall card click action.

## Technical Considerations
- Localized strictly within `sw-fe-container` (front-end).
- Update the `Field` interface in `sw-fe-container/src/app/models/field.ts` to support optional `image_url?: string;`.

## Acceptance Criteria
- Field cards feature an image (either specific or the default agricultural fallback) with a gradient overlay.
- Clicking any part of the field card navigates to `/fields/:id`.
- For multi-farm users, the farm name is displayed as a subtitle overlay on the image.
- Test-ids must be preserved to ensure unit and integration tests continue to pass.
