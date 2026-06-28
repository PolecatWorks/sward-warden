import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  styleUrl: './fields.component.css'
})
export class FieldsComponent implements OnInit {
  fields: Field[] = [];
  farms: Farm[] = [];
  farmId: number = 0;
  selectedFarmId: number = 0;
  newFieldName: string = '';
  newFieldArea: string = '';
  newFieldGeometry_wkt: string = '';
  showAddForm: boolean = false;

  editingFieldId: number | null = null;
  editFieldName: string = '';
  editFieldArea: string = '';
  editFieldGeometry_wkt: string = '';
  editFieldLandUse: string = 'grassland';
  editFieldFarmId: number = 0;

  farm: Farm | undefined;
  showEditFarmModal: boolean = false;
  editFarmName: string = '';
  editFarmLocation: string = '';
  isSaving: boolean = false;
  errorMessage: string | null = null;

  get totalArea(): number {
    return this.fields.reduce((acc, field) => acc + (field.area_hectares || 0), 0);
  }

  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService,
    private rxdbService: RxdbService,
    private authService: AuthService,
    private syncEngineService: SyncEngineService
  ) {}

  ngOnInit(): void {
    this.loadFarms();
    this.route.paramMap.subscribe(params => {
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

  loadFarms(): void {
    this.farmService.getFarms().subscribe(farms => {
      this.farms = farms;
      if (this.farms.length === 1) {
        this.selectedFarmId = this.farms[0].id || 0;
      } else if (this.farms.length > 0 && !this.selectedFarmId) {
        this.selectedFarmId = this.farms[0].id || 0;
      }
    });
  }

  loadFarm(): void {
    this.farmService.getFarms().subscribe(farms => {
      this.farm = farms.find(f => f.id === this.farmId);
    });
  }

  loadFields(): void {
    this.farmService.getFields().subscribe(allFields => {
      this.fields = allFields.filter(f => f.farm_id === this.farmId);
    });
  }

  loadAllFields(): void {
    this.farmService.getFields().subscribe(allFields => {
      this.fields = allFields;
    });
  }

  getFarmName(farmId: number | string | undefined): string {
    if (!farmId) return 'Unknown Farm';
    const farm = this.farms.find(f => f.id === Number(farmId));
    return farm ? farm.name : 'Unknown Farm';
  }

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
          const currentUserId = this.authService.getUserId() || '1';
          try {
            const user = await firstValueFrom(this.farmService.getUser(currentUserId));
            const newFarmName = user && user.name ? `${user.name}'s Farm` : 'My Farm';
            const newFarm: Farm = {
              name: newFarmName,
              location: 'Default Location',
              has_derogation: false,
              user_id: Number(currentUserId)
            };
            const createdFarm = await firstValueFrom(this.farmService.addFarm(newFarm));
            // Trigger push sync so it creates it on the backend, this is needed because
            // RxDB might just queue it in the outbox but the field might need the serverID
            // Actually RxDB will assign a local ID, but since we're using offline-first,
            // we should let RxDB handle the relation with local IDs. Wait, the backend
            // might reject the field if it references a local ID. Let's sync so the farm gets a serverId.
            // Note: forcePullSync just pulls. The outbox is processed in the background or when sync Needed.
            // The cleanest way is to use the REST API directly to avoid local ID race conditions for fields.
            // The farmService.addFarm handles both REST (if fallback) and RxDB (if not).
            // By the time `addFarm` completes, if it's REST it has an ID, if it's RxDB it has an ID (local or server).
            // The sync engine runs continuously. We will await a short time or manually trigger processOutbox if available.
            // Since we can't easily trigger a synchronous push, if we are in RxDB mode,
            // the createdFarm.id is a string like "local_...". The backend API for Field expects a BIGINT.
            // This suggests RxDB architecture needs server ID resolution first.
            // However, looking closely at farmService, it might just be better to let RxDB sync handle it.
            // But we must wait for the sync to complete to get the real serverID.
            // As a workaround, we will use the REST API explicitly here if we have to.
            // Actually, we can just rely on the syncEngineService triggering sync periodically.

            // Let's manually invoke the sync engine's full sync loop which includes pushing.
            await this.syncEngineService.fullSync();

            // Reload farms to get the serverId if synced
            const updatedFarms = await firstValueFrom(this.farmService.getFarms());
            const syncedFarm = updatedFarms.find(f => f.name === newFarmName);
            targetFarmId = syncedFarm?.id || createdFarm.id || 0;
            this.farms = updatedFarms;
          } catch (error) {
            console.error('Failed to create default farm:', error);
            this.errorMessage = 'Failed to create default farm. Please try again.';
            return;
          }
        }
      }

      const newField: Field = {
        farm_id: targetFarmId || 0,
        name: this.newFieldName,
        area_hectares: area,
        geometry_wkt: this.newFieldGeometry_wkt.trim() || undefined
      };

      this.farmService.addField(newField).subscribe(async () => {
        // Trigger a sync so the field is also synced
        await this.syncEngineService.fullSync();

        if (this.farmId) {
          this.loadFields();
        } else {
          this.loadAllFields();
        }
        this.newFieldName = '';
        this.newFieldArea = '';
        this.newFieldGeometry_wkt = '';
        this.showAddForm = false;
        this.errorMessage = null;
      });
    }
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
  }

  deleteField(id: number): void {
    this.farmService.deleteEntity('fields', id).subscribe(() => {
      if (this.farmId) {
        this.loadFields();
      } else {
        this.loadAllFields();
      }
    });
  }

  startEdit(field: Field): void {
    this.editingFieldId = field.id || null;
    this.editFieldName = field.name;
    this.editFieldArea = String(field.area_hectares);
    this.editFieldGeometry_wkt = field.geometry_wkt || '';
    this.editFieldLandUse = field.land_use || 'grassland';
    this.editFieldFarmId = field.farm_id;
  }

  cancelEdit(): void {
    this.editingFieldId = null;
    this.editFieldName = '';
    this.editFieldArea = '';
    this.editFieldGeometry_wkt = '';
    this.editFieldLandUse = 'grassland';
    this.editFieldFarmId = 0;
  }

  saveField(field: Field): void {
    if (!field.id || !this.editFieldName || !this.editFieldArea || !this.editFieldFarmId) return;
    const area = parseFloat(this.editFieldArea);
    if (isNaN(area)) return;

    const updatedField: Partial<Field> = {
      ...field,
      name: this.editFieldName,
      area_hectares: area,
      land_use: this.editFieldLandUse,
      farm_id: +this.editFieldFarmId,
      geometry_wkt: this.editFieldGeometry_wkt.trim() || undefined
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

  saveFieldFromList(): void {
    if (!this.editingFieldId || !this.editFieldName || !this.editFieldArea || !this.editFieldFarmId) return;
    const fieldId = this.editingFieldId;
    const field = this.fields.find(f => f.id === fieldId);
    if (!field) return;
    this.saveField(field);
  }

  openEditFarmModal(): void {
    if (!this.farm) return;
    this.editFarmName = this.farm.name;
    this.editFarmLocation = this.farm.location;
    this.errorMessage = null;
    this.showEditFarmModal = true;
  }

  closeEditFarmModal(): void {
    this.showEditFarmModal = false;
    this.editFarmName = '';
    this.editFarmLocation = '';
    this.errorMessage = null;
  }

  editFarm(): void {
    if (!this.farm || !this.editFarmName || !this.editFarmLocation) {
      return;
    }

    const updatedData: Partial<Farm> = {
      name: this.editFarmName,
      location: this.editFarmLocation
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
      }
    });
  }
}
