import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FarmManagementService } from '../../services/farm-management.service';
import { ComplianceBreach } from '../../models/compliance-breach';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-compliance-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compliance-report.component.html',
  styleUrl: './compliance-report.component.css'
})
export class ComplianceReportComponent implements OnInit {
  farmId!: number;
  breaches$: Observable<ComplianceBreach[]> = new Observable();
  totalPenalty$: Observable<number> = new Observable();

  constructor(
    private route: ActivatedRoute,
    private farmService: FarmManagementService
  ) {}

  // No obvious PRD requirement
  ngOnInit(): void {
    const farmIdParam = this.route.snapshot.paramMap.get('farmId');
    if (farmIdParam) {
      this.farmId = parseInt(farmIdParam, 10);
      this.loadBreaches();
    }
  }

  // No obvious PRD requirement
  loadBreaches(): void {
    this.breaches$ = this.farmService.getComplianceBreachesForFarm(this.farmId);
    this.totalPenalty$ = this.breaches$.pipe(
      // No obvious PRD requirement
      map(breaches => breaches.reduce((sum, b) => sum + (b.estimated_penalty_percentage || 0), 0))
    );
  }

  // No obvious PRD requirement
  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'Very High': return 'bg-error/10 text-error border-error/20';
      case 'High': return 'bg-warning/10 text-warning border-warning/20';
      case 'Medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'Low': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Very Low': return 'bg-surface-variant text-on-surface-variant border-outline/20';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  }
}
