import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-compliance-tracking',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule],
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
