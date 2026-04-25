import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-weather-integration',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './weather-integration.component.html',
  styleUrl: './weather-integration.component.css'
})
export class WeatherIntegrationComponent {
  currentWeather = {
    condition: 'Heavy Rain',
    temp: '10°C',
    forecast: 'Rain expected to continue for 48 hours.'
  };

  isApplicationAllowed: boolean = false; // Prevent application during heavy rain
}
