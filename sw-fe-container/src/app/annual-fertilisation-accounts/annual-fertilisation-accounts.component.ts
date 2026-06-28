import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FarmManagementService } from '../services/farm-management.service';
import { FarmRecord } from '../models/farm-record';
import { FertiliserApplication } from '../models/fertiliser-application';

@Component({
  standalone: true,
  selector: 'app-annual-fertilisation-accounts',
  imports: [RouterLink, CommonModule],
  templateUrl: './annual-fertilisation-accounts.component.html',
  styleUrl: './annual-fertilisation-accounts.component.css'
})
export class AnnualFertilisationAccountsComponent implements OnInit {
  farmRecords: FarmRecord[] = [];
  applications: FertiliserApplication[] = [];

  derogatedAccount: {
    year: number;
    hasDerogation: boolean;
    totalArea: number;
    totalN: number;
    nPerHa: number;
    isCompliant: boolean;
    limit: number;
  } | null = null;

  constructor(private fmService: FarmManagementService) {}

  // No obvious PRD requirement
  ngOnInit(): void {
    this.fmService.getFarmRecords().subscribe(records => {
      this.farmRecords = records;
      this.calculateAccount();
    });

    this.fmService.getFertiliserApplications().subscribe(apps => {
      this.applications = apps;
      this.calculateAccount();
    });
  }

  // No obvious PRD requirement
  calculateAccount() {
    if (this.farmRecords.length === 0) return;

    // Just taking the first/latest record for the summary logic
    const record = this.farmRecords[this.farmRecords.length - 1];
    const limit = record.has_derogation ? 250 : 170; // 250 for derogation, 170 normally

    let totalN = 0;
    for (const app of this.applications) {
        // Calculate applied N in kg. Assuming amount is kg and N content is percentage.
        // Actually specs say amount applied and nitrogen content (which may be a percentage or total kg).
        // Let's assume nitrogen_content is total kg of N per application, or amount * nitrogen_content/100
        // Spec 0004-02: "amount of each type of nitrogen fertiliser applied (including nitrogen content of organic manures)"
        // If nitrogen_content is not set, fallback to 0. We'll assume nitrogen_content is a percentage.
        const nContent = app.nitrogen_content || 0;
        totalN += app.amount_applied * (nContent / 100);
    }

    const area = record.agricultural_area > 0 ? record.agricultural_area : 1; // Prevent div by 0
    const nPerHa = totalN / area;

    this.derogatedAccount = {
      year: record.year,
      hasDerogation: !!record.has_derogation,
      totalArea: record.agricultural_area,
      totalN: totalN,
      nPerHa: nPerHa,
      isCompliant: record.has_derogation ? nPerHa <= limit : true, // Only show compliance relative to derogation spec limit if needed, or in general
      limit: limit
    };
  }
}
