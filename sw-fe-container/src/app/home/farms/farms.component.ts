import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
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
  newFarmName: string = '';
  newFarmLocation: string = '';
  showAddFarmModal: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string | null = null;

  constructor(private farmService: FarmManagementService) {}

  ngOnInit(): void {
    this.loadFarms();
  }

  loadFarms(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.farmService.getFarms().subscribe({
      next: (farms) => {
        this.farms = farms;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load farms. Please try again.';
        this.isLoading = false;
        console.error('Error loading farms:', err);
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
        console.error('Error adding farm:', err);
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
        console.error('Error deleting farm:', err);
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
