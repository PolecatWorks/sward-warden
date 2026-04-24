import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-compliance-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compliance-tracking.component.html',
  styleUrl: './compliance-tracking.component.css'
})
export class ComplianceTrackingComponent {
  alerts = [
    { type: 'prohibited', message: 'Application prohibited until April 1st (Winter closed period).' },
    { type: 'warning', message: 'Heavy rain forecast. High risk of runoff.' }
  ];

  regulations = [
    'Max application rate: 50m³ per hectare.',
    'No application within 10m of a watercourse.',
    'No application on waterlogged or frozen ground.'
  ];
}
