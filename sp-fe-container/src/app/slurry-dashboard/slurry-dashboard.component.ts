import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-slurry-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatListModule],
  templateUrl: './slurry-dashboard.component.html',
  styleUrl: './slurry-dashboard.component.css'
})
export class SlurryDashboardComponent {
  storageLevel: number = 65; // percentage

  events = [
    { date: '2024-04-10', description: 'Planned Application - North Field', type: 'planned' },
    { date: '2024-03-15', description: 'Historical Application - South Field', type: 'historical' },
    { date: '2023-10-05', description: 'Historical Application - East Field', type: 'historical' }
  ];
}
