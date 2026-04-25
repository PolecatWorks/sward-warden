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
  styleUrls: ['./soil-analysis-results.css']
})
export class SoilAnalysisResults implements OnInit {
  fields: Field[] = [];
  analyses: SoilAnalysis[] = [];
  newAnalysis: SoilAnalysis = {
    field_id: 0,
    sample_date: new Date().toISOString().split('T')[0]
  };

  constructor(private farmService: FarmManagementService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.farmService.getFields().subscribe(fields => this.fields = fields);
    this.farmService.getSoilAnalyses().subscribe(analyses => this.analyses = analyses);
  }

  addAnalysis(): void {
    if (this.newAnalysis.field_id > 0 && this.newAnalysis.sample_date) {
      this.farmService.addSoilAnalysis(this.newAnalysis).subscribe(() => {
        this.loadData();
        this.newAnalysis = {
          field_id: 0,
          sample_date: new Date().toISOString().split('T')[0],
          ph_level: undefined,
          phosphorus_index: undefined,
          potassium_index: undefined,
          magnesium_index: undefined
        };
      });
    }
  }

  deleteAnalysis(id: number | undefined): void {
    if (id) {
      this.farmService.deleteSoilAnalysis(id).subscribe(() => {
        this.loadData();
      });
    }
  }

  getFieldName(fieldId: number): string {
    const field = this.fields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  }
}
