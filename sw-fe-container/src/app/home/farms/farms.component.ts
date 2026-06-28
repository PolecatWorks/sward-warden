import { combineLatest } from 'rxjs';
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { LoggerService } from '../../services/logger.service';
import { Farm } from '../../models/farm';
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
  farmFieldCounts: { [farmId: string]: number } = {};
  newFarmName: string = '';
  newFarmLocation: string = '';
  showAddFarmModal: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private farmService: FarmManagementService,
    private logger: LoggerService
  ) {}

  // PRD Reference: 0003
  ngOnInit(): void {
    this.loadFarms();
  }


  @HostListener('document:keydown.escape', ['$event'])
  // PRD Reference: 0003
  handleEscape(event: KeyboardEvent) {
    if (this.showAddFarmModal) {
      this.closeAddFarmModal();
    }
    if (this.editingFarmId !== null) {
      this.cancelEdit();
    }
  }

  // PRD Reference: 0003
  loadFarms(): void {
    this.isLoading = true;
    this.errorMessage = null;
    combineLatest({
      farms: this.farmService.getFarms(),
      fields: this.farmService.getFields()
    }).subscribe({
      next: ({ farms, fields }) => {
        this.farms = farms;
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

  // PRD Reference: 0003
  addFarm(): void {
    if (!this.newFarmName || !this.newFarmLocation || this.isSaving) {
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

  editingFarmId: number | null = null;
  editFarmName: string = '';
  editFarmLocation: string = '';
  originalEditFarmName: string = '';
  originalEditFarmLocation: string = '';

  // PRD Reference: 0003
  openAddFarmModal(): void {
    this.newFarmName = '';
    this.newFarmLocation = '';
    this.errorMessage = null;
    this.showAddFarmModal = true;
  }

  // PRD Reference: 0003
  closeAddFarmModal(): void {
    this.showAddFarmModal = false;
    this.newFarmName = '';
    this.newFarmLocation = '';
  }

  // PRD Reference: 0003
  startEdit(farm: Farm): void {
    this.editingFarmId = farm.id || null;
    this.editFarmName = farm.name;
    this.editFarmLocation = farm.location;
    this.originalEditFarmName = farm.name;
    this.originalEditFarmLocation = farm.location;
  }


  // PRD Reference: 0003
  hasEditChanges(): boolean {
    return this.editFarmName !== this.originalEditFarmName ||
           this.editFarmLocation !== this.originalEditFarmLocation;
  }

  // PRD Reference: 0003
  cancelEdit(): void {
    this.editingFarmId = null;
    this.editFarmName = '';
    this.editFarmLocation = '';
  }

  // PRD Reference: 0003
  saveFarmFromList(): void {
    if (!this.editingFarmId || !this.editFarmName || !this.editFarmLocation || !this.hasEditChanges()) {
      return;
    }

    const updatedData: Partial<Farm> = {
      name: this.editFarmName,
      location: this.editFarmLocation
    };

    this.isSaving = true;
    this.farmService.updateFarm(this.editingFarmId, updatedData).subscribe({
      next: () => {
        this.cancelEdit();
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
