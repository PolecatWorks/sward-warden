import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FarmManagementService } from '../services/farm-management.service';
import { Field } from '../models/field';
import { SoilAnalysis } from '../models/soil-analysis';

@Component({
  selector: 'app-soil-analysis-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './soil-analysis-results.html',
  styleUrls: ['./soil-analysis-results.css'],
})
export class SoilAnalysisResults implements OnInit {
  fields: Field[] = [];
  analyses: SoilAnalysis[] = [];
  editingId: number | undefined = undefined;
  newAnalysis: SoilAnalysis = {
    field_id: 0,
    sample_date: new Date().toISOString().split('T')[0],
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
      .getSoilAnalyses()
      .subscribe((analyses) => (this.analyses = analyses));
  }

  resetForm(): void {
    this.editingId = undefined;
    this.newAnalysis = {
      field_id: 0,
      sample_date: new Date().toISOString().split('T')[0],
      ph_level: undefined,
      phosphorus_index: undefined,
      potassium_index: undefined,
      magnesium_index: undefined,
    };
  }

  editAnalysis(analysis: SoilAnalysis): void {
    this.editingId = analysis.id;
    this.newAnalysis = { ...analysis };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  // No obvious PRD requirement
  saveAnalysis(): void {
    if (this.newAnalysis.field_id > 0 && this.newAnalysis.sample_date) {
      if (this.editingId) {
        this.farmService.updateSoilAnalysis(this.newAnalysis).subscribe(() => {
          this.loadData();
          this.resetForm();
        });
      } else {
        this.farmService.addSoilAnalysis(this.newAnalysis).subscribe(() => {
          this.loadData();
          this.resetForm();
        });
      }
    }
  }

  // No obvious PRD requirement
  deleteAnalysis(): void {
    if (this.editingId) {
      this.farmService.deleteEntity('soil_analyses', this.editingId).subscribe(() => {
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
