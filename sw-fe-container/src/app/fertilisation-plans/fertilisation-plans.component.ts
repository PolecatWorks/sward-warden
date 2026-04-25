import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { Farm } from '../models/farm';
import { FertilisationPlan } from '../models/fertilisation-plan';

@Component({
  selector: 'app-fertilisation-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fertilisation-plans.component.html',
  styleUrls: ['./fertilisation-plans.component.css']
})
export class FertilisationPlansComponent implements OnInit {
  farms: Farm[] = [];
  plans: FertilisationPlan[] = [];
  newPlan: FertilisationPlan = {
    farm_id: 0,
    year: new Date().getFullYear(),
    plan_content: '',
    derogation_status: false,
    chemical_p_grassland: false,
    high_p_manure: false,
    anaerobic_digestate: false
  };

  constructor(private farmService: FarmManagementService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.farmService.getFarms().subscribe(farms => this.farms = farms);
    this.farmService.getFertilisationPlans().subscribe(plans => this.plans = plans);
  }

  addPlan(): void {
    if (this.newPlan.farm_id > 0 && this.newPlan.year && this.newPlan.plan_content) {
      this.farmService.addFertilisationPlan(this.newPlan).subscribe(() => {
        this.loadData();
        this.newPlan = {
          farm_id: 0,
          year: new Date().getFullYear(),
          plan_content: '',
          derogation_status: false,
          chemical_p_grassland: false,
          high_p_manure: false,
          anaerobic_digestate: false
        };
      });
    }
  }

  deletePlan(id: number | undefined): void {
    if (id) {
      this.farmService.deleteFertilisationPlan(id).subscribe(() => {
        this.loadData();
      });
    }
  }

  getFarmName(farmId: number): string {
    const farm = this.farms.find(f => f.id === farmId);
    return farm ? farm.name : 'Unknown Farm';
  }
}
