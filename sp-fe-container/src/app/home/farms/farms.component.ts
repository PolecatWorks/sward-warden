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

  constructor(private farmService: FarmManagementService) {}

  ngOnInit(): void {
    this.loadFarms();
  }

  loadFarms(): void {
    this.farmService.getFarms().subscribe(farms => {
      this.farms = farms;
    });
  }

  addFarm(): void {
    if (this.newFarmName && this.newFarmLocation) {
      const newFarm: Farm = {
        id: Date.now(), // Generate a temporary ID
        user_id: 1, // Default user_id for now
        name: this.newFarmName,
        location: this.newFarmLocation
      };

      this.farmService.addFarm(newFarm).subscribe(() => {
        this.loadFarms();
        this.newFarmName = '';
        this.newFarmLocation = '';
      });
    }
  }

  deleteFarm(id: number): void {
    this.farmService.deleteFarm(id).subscribe(() => {
      this.loadFarms();
    });
  }
}
