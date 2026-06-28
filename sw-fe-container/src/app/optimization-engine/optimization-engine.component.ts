import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  OptimizationService,
  OptimizationSuggestion,
} from '../services/optimization.service';
import { WeatherIntegrationComponent } from '../weather-integration/weather-integration.component';

@Component({
  selector: 'app-optimization-engine',
  standalone: true,
  imports: [CommonModule, RouterModule, WeatherIntegrationComponent],
  templateUrl: './optimization-engine.component.html',
  styleUrl: './optimization-engine.component.css',
})
export class OptimizationEngineComponent implements OnInit {
  suggestions: OptimizationSuggestion[] = [];
  isLoading = true;

  constructor(private optimizationService: OptimizationService) {}

  // No obvious PRD requirement
  ngOnInit() {
    // Hardcoded farmId for now, should come from route or state
    this.optimizationService.getSuggestions(1).subscribe({
      next: (plan) => {
        this.suggestions = plan.suggestions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load suggestions', err);
        this.isLoading = false;
      },
    });
  }
}
