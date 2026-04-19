import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-topology-mapping',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  templateUrl: './topology-mapping.component.html',
  styleUrl: './topology-mapping.component.css'
})
export class TopologyMappingComponent {
  fields = [
    { name: 'North Field', slope: 'Gentle (2%)', riskLevel: 'Low' },
    { name: 'South Field', slope: 'Moderate (8%)', riskLevel: 'Medium' },
    { name: 'River Bend Field', slope: 'Steep (15%)', riskLevel: 'High' }
  ];
}
