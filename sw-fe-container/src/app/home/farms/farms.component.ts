import { combineLatest } from 'rxjs';
import { Component, OnInit } from '@angular/core';
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
}
