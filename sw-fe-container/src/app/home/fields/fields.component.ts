import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { Field } from '../../models/field';
import { Farm } from '../../models/farm';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './fields.component.html',
  styleUrl: './fields.component.css'
})
export class FieldsComponent implements OnInit {
  fields: Field[] = [];
  farmId: number = 0;
  newFieldName: string = '';
  newFieldArea: string = '';
  showAddForm: boolean = false;

  editingFieldId: number | null = null;
  editFieldName: string = '';
  editFieldArea: string = '';

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
    private farmService: FarmManagementService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('farmId');
      if (id) {
        this.farmId = +id;
        this.loadFarm();
        this.loadFields();
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

  addField(): void {
    if (this.newFieldName && this.newFieldArea) {
      const area = parseFloat(this.newFieldArea);
      if (isNaN(area)) return;
      const newField: Field = {
        farm_id: this.farmId,
        name: this.newFieldName,
        area_hectares: area
      };

      this.farmService.addField(newField).subscribe(() => {
        this.loadFields();
        this.newFieldName = '';
        this.newFieldArea = '';
        this.showAddForm = false;
      });
    }
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
  }

  deleteField(id: number): void {
    this.farmService.deleteEntity('fields', id).subscribe(() => {
      this.loadFields();
    });
  }

  startEdit(field: Field): void {
    this.editingFieldId = field.id || null;
    this.editFieldName = field.name;
    this.editFieldArea = String(field.area_hectares);
  }

  cancelEdit(): void {
    this.editingFieldId = null;
    this.editFieldName = '';
    this.editFieldArea = '';
  }

  saveField(field: Field): void {
    if (!field.id || !this.editFieldName || !this.editFieldArea) return;
    const area = parseFloat(this.editFieldArea);
    if (isNaN(area)) return;

    const updatedField: Partial<Field> = {
      ...field,
      name: this.editFieldName,
      area_hectares: area
    };

    this.farmService.updateField(field.id, updatedField).subscribe(() => {
      this.loadFields();
      this.cancelEdit();
    });
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
