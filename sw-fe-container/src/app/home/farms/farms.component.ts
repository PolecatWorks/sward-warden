import { combineLatest } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { LoggerService } from '../../services/logger.service';
import { Farm } from '../../models/farm';
import { Field } from '../../models/field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-farms',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './farms.component.html',
  styleUrl: './farms.component.css'
})
export class FarmsComponent implements OnInit {
  farms: Farm[] = [];
  totalFieldsCount: number = 0;
  farmFieldCounts: { [farmId: string]: number } = {};
  newFarmName: string = '';
  newFarmLocation: string = '';
  showAddFarmModal: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string | null = null;

  showEditFarmModal: boolean = false;
  editingFarm: Farm | null = null;
  editFarmName: string = '';
  editFarmLocation: string = '';

  constructor(
    private farmService: FarmManagementService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadFarms();
  }

  loadFarms(): void {
    this.isLoading = true;
    this.errorMessage = null;
    combineLatest({
      farms: this.farmService.getFarms(),
      fields: this.farmService.getFields()
    }).subscribe({
      next: ({ farms, fields }) => {
        this.farms = farms;
        this.totalFieldsCount = fields.length;
        this.farmFieldCounts = {};
        for (const field of fields) {
          const farmIdStr = String(field.farm_id);
          this.farmFieldCounts[farmIdStr] = (this.farmFieldCounts[farmIdStr] || 0) + 1;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load data. Please try again.';
        this.isLoading = false;
        this.logger.error('Error loading data:', err);
      }
    });
  }


  addFarm(): void {
    if (!this.newFarmName || !this.newFarmLocation) {
      return;
    }

    const newFarm: Farm = {
      name: this.newFarmName,
      location: this.newFarmLocation
    };

    this.isSaving = true;
    this.farmService.addFarm(newFarm).subscribe({
      next: () => {
        this.newFarmName = '';
        this.newFarmLocation = '';
        this.showAddFarmModal = false;
        this.isSaving = false;
        this.loadFarms();
      },
      error: (err) => {
        this.errorMessage = 'Failed to add farm. Please try again.';
        this.isSaving = false;
        this.logger.error('Error adding farm:', err);
      }
    });
  }

  deleteFarm(id: number): void {
    this.farmService.deleteEntity('farms', id).subscribe({
      next: () => {
        this.loadFarms();
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete farm. Please try again.';
        this.logger.error('Error deleting farm:', err);
      }
    });
  }

  openAddFarmModal(): void {
    this.newFarmName = '';
    this.newFarmLocation = '';
    this.errorMessage = null;
    this.showAddFarmModal = true;
  }

  closeAddFarmModal(): void {
    this.showAddFarmModal = false;
    this.newFarmName = '';
    this.newFarmLocation = '';
  }

  openEditFarmModal(farm: Farm, event: Event): void {
    event.stopPropagation();
    this.editingFarm = farm;
    this.editFarmName = farm.name;
    this.editFarmLocation = farm.location;
    this.errorMessage = null;
    this.showEditFarmModal = true;
  }

  closeEditFarmModal(): void {
    this.showEditFarmModal = false;
    this.editingFarm = null;
    this.editFarmName = '';
    this.editFarmLocation = '';
  }

  editFarm(): void {
    if (!this.editingFarm || !this.editFarmName || !this.editFarmLocation) {
      return;
    }

    const updatedData: Partial<Farm> = {
      name: this.editFarmName,
      location: this.editFarmLocation
    };

    this.isSaving = true;
    this.farmService.updateFarm(this.editingFarm.id!, updatedData).subscribe({
      next: () => {
        this.closeEditFarmModal();
        this.isSaving = false;
        this.loadFarms();
      },
      error: (err) => {
        this.errorMessage = 'Failed to update farm. Please try again.';
        this.isSaving = false;
        this.logger.error('Error updating farm:', err);
      }
    });
  }
}
