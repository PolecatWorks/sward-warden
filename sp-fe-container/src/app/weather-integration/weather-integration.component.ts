import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-weather-integration',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './weather-integration.component.html',
  styleUrl: './weather-integration.component.css'
})
export class WeatherIntegrationComponent {

}
