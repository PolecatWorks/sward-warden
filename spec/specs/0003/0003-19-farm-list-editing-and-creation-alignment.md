# 0003-19 Farm List Editing and Creation Alignment Specification

**State**: Complete

## Scope
This specification describes the changes required to align farm creation and editing with the new field UX/routing experience (full-width inline forms focused on task, clean route parameters, and URL navigation instead of modal overlays).

## Proposed Changes
1. **Routing Updates** (`app.routes.ts`):
   - Add route mapping `{ path: 'farms/new', component: FarmsComponent }` matching before parameterized routes.
   - Add route mapping `{ path: 'farms/:farmId/edit', component: FarmDetailComponent }` matching before the details route.
2. **Farm List & Creation Mode Integration** (`FarmsComponent`):
   - Inject `Router` in `FarmsComponent`.
   - Subscribe to the route URL in `ngOnInit()`. Automatically toggle `showAddFarmModal = isNew` based on `/new` segment matching.
   - Hide the operational overview, registered farms list, and add button FAB when the form is active (`*ngIf="!showAddFarmModal"`).
   - Update `toggleAddFarm()` / `closeAddFarmModal()` to redirect back to `/farms` if the URL ends with `/new`.
   - Redesign the Add Farm Form container styling in `farms.component.html` to match the full-width border-rounded design of the fields form.
   - Remove inline editing modal, controls, and methods (`startEdit`, `cancelEdit`, `saveFarmFromList`) from `FarmsComponent` and template since editing is delegated to `FarmDetailComponent`.
3. **Farm Detail & Edit Mode Integration** (`FarmDetailComponent`):
   - Subscribe to the route URL in `ngOnInit()`. Automatically open the edit farm form if the URL ends with `/edit`.
   - Update `closeEditFarmModal()` / `editFarm()` to navigate back to `/farms/:farmId` if the URL ends with `/edit`.
   - Hide overview cards, delete buttons, and other detail sections when editing (`*ngIf="!showEditFarmModal"`).
   - Adjust page wrapper width class dynamically to support full width during editing mode.

## Verification Plan
- Verify navigating to `/farms/new` focuses on the full-width creation form.
- Verify editing a farm from the list/detail page navigates to `/farms/:farmId/edit` with full-width form and hides other page sections.
- Verify saving or canceling redirects appropriately.
- Run integration tests using `make robot-test` to ensure all tests pass.
