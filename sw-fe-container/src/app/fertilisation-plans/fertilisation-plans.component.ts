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
  editingId: number | undefined = undefined;
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

  resetForm(): void {
    this.editingId = undefined;
    this.newPlan = {
      field_id: 0,
      crop_type: '',
      target_yield: 0,
      nitrogen_requirement: 0,
      phosphorus_requirement: 0,
      potassium_requirement: 0,
      application_date: new Date().toISOString().split('T')[0],
    };
  }

  editPlan(plan: FertilisationPlan): void {
    this.editingId = plan.id;
    this.newPlan = { ...plan };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  // No obvious PRD requirement
  savePlan(): void {
    if (
      this.newPlan.field_id > 0 &&
      this.newPlan.crop_type &&
      this.newPlan.application_date
    ) {
      if (this.editingId) {
        this.farmService.updateFertilisationPlan(this.newPlan).subscribe(() => {
          this.loadData();
          this.resetForm();
        });
      } else {
        this.farmService.addFertilisationPlan(this.newPlan).subscribe(() => {
          this.loadData();
          this.resetForm();
        });
      }
    }
  }

  // No obvious PRD requirement
  deletePlan(): void {
    if (this.editingId) {
      this.farmService.deleteEntity('fertilisation_plans', this.editingId).subscribe(() => {
        this.loadData();
        this.resetForm();
      });
    }
  }

  // No obvious PRD requirement
  getFieldName(fieldId: number): string {
    const field = this.fields.find((f) => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  }
}
