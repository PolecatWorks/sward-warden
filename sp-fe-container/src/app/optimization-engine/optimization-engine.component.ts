import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-optimization-engine',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule],
  templateUrl: './optimization-engine.component.html',
  styleUrl: './optimization-engine.component.css'
})
export class OptimizationEngineComponent {
  suggestions = [
    { field: 'North Field', date: '2024-04-15', rate: '30m³/ha', reason: 'Optimal soil moisture and upcoming dry spell.' },
    { field: 'East Field', date: '2024-04-18', rate: '25m³/ha', reason: 'Crop nutrient demand peaking.' }
  ];
}
