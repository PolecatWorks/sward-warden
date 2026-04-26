import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { WeatherService, WeatherData } from '../services/weather.service';

@Component({
  selector: 'app-weather-integration',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './weather-integration.component.html',
  styleUrl: './weather-integration.component.css'
})
export class WeatherIntegrationComponent implements OnInit {
  forecast: WeatherData[] = [];
  isApplicationAllowed: boolean = true;

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.weatherService.getForecast(0, 0).subscribe(data => {
      this.forecast = data;
      // Simple logic: if any forecast in next 48h has > 10mm rain, block
      this.isApplicationAllowed = !data.some(d => d.precipitation_amount_mm > 10 || d.precipitation_probability > 75);
    });
  }
}
