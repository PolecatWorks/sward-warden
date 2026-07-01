# Technical Specification: Field Creation & Edit Farm Selector enhancements

## 1. Overview
This specification details the technical changes required to implement PRD 0003. We will modify the `FieldsComponent` (List View) and `FieldViewComponent` (Detail View) to unify the field editing experience and improve the field creation form's Farm selector behavior.

## 2. Front-End Changes (`sw-fe-container`)

### 2.1. `FieldsComponent` (List View)

#### 2.1.1. TypeScript (`fields.component.ts`)
*   **Properties**:
    *   Add `editFieldLandUse: string = 'grassland';`
    *   Add `editFieldFarmId: number = 0;`
*   **Initialization (`ngOnInit`)**:
    *   When populating `farms` (e.g., via `farmService.getFarms().subscribe()`), check if `this.farms.length === 1`. If so, automatically set `this.selectedFarmId = this.farms[0].id`.
*   **Editing Logic**:
    *   Update `openEditFieldModal(field: Field)`:
        *   Initialize `this.editFieldLandUse = field.land_use || 'grassland';`
        *   Initialize `this.editFieldFarmId = field.farm_id;`
    *   Update `closeEditFieldModal()`:
        *   Reset `this.editFieldLandUse = 'grassland';`
        *   Reset `this.editFieldFarmId = 0;`
    *   Update `saveFieldFromList()`:
        *   Ensure `land_use: this.editFieldLandUse` and `farm_id: +this.editFieldFarmId` are included in the updated field payload sent to the backend.

#### 2.1.2. HTML (`fields.component.html`)
*   **Add Field Modal**:
    *   Wrap the `<label for="newFieldFarm">` and `<select id="newFieldFarm">` block with `*ngIf="farms.length > 0"`.
*   **Edit Field Inline Modal**:
    *   Add the `Land Use` input: A `<select>` bound to `[(ngModel)]="editFieldLandUse"`.
    *   Add the `Farm` input: A `<select>` bound to `[(ngModel)]="editFieldFarmId"`, populating `<option>` elements using `*ngFor="let f of farms" [value]="f.id"`.
    *   Ensure styling and layout match the form in `field-view.component.html`.

### 2.2. `FieldViewComponent` (Detail View)

#### 2.2.1. TypeScript (`field-view.component.ts`)
*   **Properties**:
    *   Add `editFieldGeometry_wkt: string = '';`
*   **Editing Logic**:
    *   Update `openEditFieldModal()`:
        *   Initialize `this.editFieldGeometry_wkt = this.field.geometry_wkt || '';`
    *   Update `closeEditFieldModal()`:
        *   Reset `this.editFieldGeometry_wkt = '';`
    *   Update `editField()`:
        *   Ensure `geometry_wkt: this.editFieldGeometry_wkt.trim() || undefined` is included in the updated field payload sent to the backend.

#### 2.2.2. HTML (`field-view.component.html`)
*   **Edit Field Modal**:
    *   Add the `Geometry (WKT)` input: An `<input type="text">` bound to `[(ngModel)]="editFieldGeometry_wkt"`.
    *   Ensure styling matches the layout.

## 3. Testing
*   Update unit tests in `fields.component.spec.ts` and `field-view.component.spec.ts` to assert that:
    *   The Farm selector is hidden when `farms.length === 0`.
    *   The `selectedFarmId` defaults to the only farm when `farms.length === 1`.
    *   The `editFieldLandUse`, `editFieldFarmId`, and `editFieldGeometry_wkt` properties are correctly initialized, reset, and included in the update payload.
