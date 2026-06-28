import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { Field } from '../models/field';
import { FertilisationPlan } from '../models/fertilisation-plan';

@Component({
  selector: 'app-fertilisation-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fertilisation-plans.component.html',
  styleUrls: ['./fertilisation-plans.component.css'],
})
export class FertilisationPlansComponent implements OnInit {
  fields: Field[] = [];
  plans: FertilisationPlan[] = [];
  newPlan: FertilisationPlan = {
    field_id: 0,
    crop_type: '',
    target_yield: 0,
    nitrogen_requirement: 0,
    phosphorus_requirement: 0,
    potassium_requirement: 0,
    application_date: new Date().toISOString().split('T')[0],
  };

  constructor(private farmService: FarmManagementService) {}

  // No obvious PRD requirement
  ngOnInit(): void {
    this.loadData();
  }

  // No obvious PRD requirement
  loadData(): void {
    this.farmService.getFields().subscribe((fields) => (this.fields = fields));
    this.farmService
      .getFertilisationPlans()
      .subscribe((plans) => (this.plans = plans));
  }

  // No obvious PRD requirement
  addPlan(): void {
    if (
      this.newPlan.field_id > 0 &&
      this.newPlan.crop_type &&
      this.newPlan.application_date
    ) {
      this.farmService.addFertilisationPlan(this.newPlan).subscribe(() => {
        this.loadData();
        this.newPlan = {
          field_id: 0,
          crop_type: '',
          target_yield: 0,
          nitrogen_requirement: 0,
          phosphorus_requirement: 0,
          potassium_requirement: 0,
          application_date: new Date().toISOString().split('T')[0],
        };
      });
    }
  }

  // No obvious PRD requirement
  deletePlan(id: number | undefined): void {
    if (id) {
      this.farmService.deleteEntity('fertilisation_plans', id).subscribe(() => {
        this.loadData();
      });
    }
  }

  // No obvious PRD requirement
  getFieldName(fieldId: number): string {
    const field = this.fields.find((f) => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  }
}
