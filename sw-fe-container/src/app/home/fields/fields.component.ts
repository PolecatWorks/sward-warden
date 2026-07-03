import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { RxdbService } from '../../services/rxdb/rxdb.service';
import { AuthService } from '../../services/auth.service';
import { SyncEngineService } from '../../services/sync-engine.service';
import { Field } from '../../models/field';
import { Farm } from '../../models/farm';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FieldMapEditorComponent } from '../../shared/components/field-map-editor/field-map-editor.component';

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FieldMapEditorComponent],
  templateUrl: './fields.component.html',
  styleUrl: './fields.component.css',
})
export class FieldsComponent implements OnInit {
  fields: Field[] = [];
  farms: Farm[] = [];
  farmId: number = 0;
  selectedFarmId: number = 0;
  newFieldName: string = '';
  newFieldArea: string = '';
  newFieldGeometry_geojson: string = '';
  newFieldLandUse: string = 'grassland';
  showAddForm: boolean = false;

  editingFieldId: number | null = null;
  editFieldName: string = '';
  editFieldArea: string = '';
  editFieldGeometry_geojson: string = '';
  editFieldLandUse: string = 'grassland';
  editFieldFarmId: number | string = 0;

  originalEditFieldName: string = '';
  originalEditFieldArea: string = '';
  originalEditFieldGeometry_geojson: string = '';
  originalEditFieldLandUse: string = 'grassland';
  originalEditFieldFarmId: number | string = 0;

  farm: Farm | undefined;
  showEditFarmModal: boolean = false;
  editFarmName: string = '';
  editFarmLocation: string = '';
  originalEditFarmName: string = '';
  originalEditFarmLocation: string = '';
  isSaving: boolean = false;
  errorMessage: string | null = null;

  // PRD Reference: 0003
  get totalArea(): number {
    return this.fields.reduce(
      (acc, field) => acc + (field.area_hectares || 0),
      0,
    );
  }

  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService,
    private rxdbService: RxdbService,
    private authService: AuthService,
    private syncEngineService: SyncEngineService,
    private router: Router,
  ) {}

  // PRD Reference: 0003
  ngOnInit(): void {
    this.loadFarms();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('farmId');
      if (id) {
        this.farmId = +id;
        this.loadFarm();
        this.loadFields();
      } else {
        this.farmId = 0;
        this.farm = undefined;
        this.loadAllFields();
      }
    });

    this.route.url.subscribe((urlSegments) => {
      const isNew = urlSegments.some((segment) => segment.path === 'new');
      this.showAddForm = isNew;
    });

    // Automatically reload fields when local DB fallback status changes
    this.rxdbService.fallbackToRest$.subscribe(() => {
      this.loadFarms();
      if (this.farmId) {
        this.loadFarm();
        this.loadFields();
      } else {
        this.loadAllFields();
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  // PRD Reference: 0002, 0003
  handleEscape(event: KeyboardEvent) {
    if (this.showAddForm) {
      this.toggleAddForm();
    }
    if (this.showEditFarmModal) {
      this.closeEditFarmModal();
    }
    if (this.editingFieldId !== null) {
      this.cancelEdit();
    }
  }

  // PRD Reference: 0003
  loadFarms(): void {
    this.farmService.getFarms().subscribe((farms) => {
      this.farms = farms;
      if (this.farms.length === 1) {
        this.selectedFarmId = this.farms[0].id || 0;
      } else if (this.farms.length > 0 && !this.selectedFarmId) {
        this.selectedFarmId = this.farms[0].id || 0;
      }
    });
  }

  // PRD Reference: 0003
  loadFarm(): void {
    this.farmService.getFarms().subscribe((farms) => {
      this.farm = farms.find((f) => f.id === this.farmId);
    });
  }

  // PRD Reference: 0003
  loadFields(): void {
    this.farmService.getFields().subscribe((allFields) => {
      this.fields = allFields.filter((f) => f.farm_id === this.farmId);
    });
  }

  // PRD Reference: 0003
  loadAllFields(): void {
    this.farmService.getFields().subscribe((allFields) => {
      this.fields = allFields;
    });
  }

  // PRD Reference: 0003
  getFarmName(farmId: number | string | undefined): string {
    if (!farmId) return 'Unknown Farm';
    const farm = this.farms.find((f) => f.id === Number(farmId));
    return farm ? farm.name : 'Unknown Farm';
  }

  // PRD Reference: 0003
  async addField(): Promise<void> {
    if (this.newFieldName && this.newFieldArea) {
      const area = parseFloat(this.newFieldArea);
      if (isNaN(area)) return;

      let targetFarmId = this.farmId || this.selectedFarmId;

      if (!targetFarmId) {
        if (this.farms.length > 0) {
          this.errorMessage = 'Please select a farm.';
          return;
        } else {
          // Auto-create a default farm for the user if they don't have one
          // PRD Reference: 0003
          const currentUserId = this.authService.getUserId() || '1';
          try {
            const user = await firstValueFrom(
              this.farmService.getUser(currentUserId),
            );
            const newFarmName =
              user && user.name ? `${user.name}'s Farm` : 'My Farm';
            const newFarm: Farm = {
              name: newFarmName,
              location: 'Default Location',
              has_derogation: false,
              user_id: Number(currentUserId),
            };
            const createdFarm = await firstValueFrom(
              this.farmService.addFarm(newFarm),
            );
            await this.syncEngineService.fullSync();

            // Reload farms to get the serverId if synced
            const updatedFarms = await firstValueFrom(
              this.farmService.getFarms(),
            );
            const syncedFarm = updatedFarms.find((f) => f.name === newFarmName);
            targetFarmId = syncedFarm?.id || createdFarm.id || 0;
            this.farms = updatedFarms;
          } catch (error) {
            console.error('Failed to create default farm:', error);
            this.errorMessage =
              'Failed to create default farm. Please try again.';
            return;
          }
        }
      }

      const newField: Field = {
        farm_id: targetFarmId || 0,
        name: this.newFieldName,
        area_hectares: area,
        land_use: this.newFieldLandUse,
        geometry_geojson: this.newFieldGeometry_geojson.trim() || undefined,
      };

      this.farmService.addField(newField).subscribe(async () => {
        // Trigger a sync so the field is also synced
        await this.syncEngineService.fullSync();

        if (this.farmId) {
          this.loadFields();
        } else {
          this.loadAllFields();
        }
        this.showAddForm = true;
        this.toggleAddForm();
        this.errorMessage = null;
      });
    }
  }

  // PRD Reference: 0003
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newFieldName = '';
      this.newFieldArea = '';
      this.newFieldGeometry_geojson = '';
      this.newFieldLandUse = 'grassland';
      if (this.router.url.endsWith('/new')) {
        if (this.farmId) {
          this.router.navigate(['/farms', this.farmId, 'fields']);
        } else {
          this.router.navigate(['/fields']);
        }
      }
    }
  }

  // PRD Reference: 0003
  deleteField(id: number): void {
    this.farmService.deleteEntity('fields', id).subscribe(() => {
      if (this.farmId) {
        this.loadFields();
      } else {
        this.loadAllFields();
      }
    });
  }

  // PRD Reference: 0002, 0003
  startEdit(field: Field): void {
    this.editingFieldId = field.id || null;
    this.editFieldName = field.name;
    this.editFieldArea = String(field.area_hectares);
    this.editFieldGeometry_geojson = field.geometry_geojson || '';
    this.editFieldLandUse = field.land_use || 'grassland';
    this.editFieldFarmId = field.farm_id;

    this.originalEditFieldName = this.editFieldName;
    this.originalEditFieldArea = this.editFieldArea;
    this.originalEditFieldGeometry_geojson = this.editFieldGeometry_geojson;
    this.originalEditFieldLandUse = this.editFieldLandUse;
    this.originalEditFieldFarmId = this.editFieldFarmId;
  }

  // PRD Reference: 0002
  hasFieldEditChanges(): boolean {
    return (
      this.editFieldName !== this.originalEditFieldName ||
      this.editFieldArea !== this.originalEditFieldArea ||
      this.editFieldGeometry_geojson !==
        this.originalEditFieldGeometry_geojson ||
      this.editFieldLandUse !== this.originalEditFieldLandUse ||
      this.editFieldFarmId != this.originalEditFieldFarmId
    );
  }

  // PRD Reference: 0003
  cancelEdit(): void {
    this.editingFieldId = null;
    this.editFieldName = '';
    this.editFieldArea = '';
    this.editFieldGeometry_geojson = '';
    this.editFieldLandUse = 'grassland';
    this.editFieldFarmId = 0;
  }

  // PRD Reference: 0003
  saveField(field: Field): void {
    if (
      !field.id ||
      !this.editFieldName ||
      !this.editFieldArea ||
      !this.editFieldFarmId
    )
      return;
    const area = parseFloat(this.editFieldArea);
    if (isNaN(area)) return;

    const updatedField: Partial<Field> = {
      ...field,
      name: this.editFieldName,
      area_hectares: area,
      land_use: this.editFieldLandUse,
      farm_id: +this.editFieldFarmId,
      geometry_geojson: this.editFieldGeometry_geojson.trim() || undefined,
    };

    this.farmService.updateField(field.id, updatedField).subscribe(() => {
      if (this.farmId) {
        this.loadFields();
      } else {
        this.loadAllFields();
      }
      this.cancelEdit();
    });
  }

  // PRD Reference: 0002, 0003
  saveFieldFromList(): void {
    if (
      !this.editingFieldId ||
      !this.editFieldName ||
      !this.editFieldArea ||
      !this.editFieldFarmId ||
      !this.hasFieldEditChanges()
    )
      return;
    const fieldId = this.editingFieldId;
    const field = this.fields.find((f) => f.id === fieldId);
    if (!field) return;
    this.saveField(field);
  }

  // PRD Reference: 0003
  openEditFarmModal(): void {
    if (!this.farm) return;
    this.editFarmName = this.farm.name;
    this.editFarmLocation = this.farm.location;
    this.originalEditFarmName = this.farm.name;
    this.originalEditFarmLocation = this.farm.location;
    this.errorMessage = null;
    this.showEditFarmModal = true;
  }

  // PRD Reference: 0003
  hasEditChanges(): boolean {
    return (
      this.editFarmName !== this.originalEditFarmName ||
      this.editFarmLocation !== this.originalEditFarmLocation
    );
  }

  // PRD Reference: 0003
  closeEditFarmModal(): void {
    this.showEditFarmModal = false;
    this.editFarmName = '';
    this.editFarmLocation = '';
    this.errorMessage = null;
  }

  // PRD Reference: 0003
  editFarm(): void {
    if (
      !this.farm ||
      !this.editFarmName ||
      !this.editFarmLocation ||
      !this.hasEditChanges()
    ) {
      return;
    }

    const updatedData: Partial<Farm> = {
      name: this.editFarmName,
      location: this.editFarmLocation,
    };

    this.isSaving = true;
    this.farmService.updateFarm(this.farmId, updatedData).subscribe({
      next: () => {
        this.closeEditFarmModal();
        this.isSaving = false;
        this.loadFarm();
      },
      error: (err) => {
        this.errorMessage = 'Failed to update farm. Please try again.';
        this.isSaving = false;
        console.error('Error updating farm:', err);
      },
    });
  }
}
