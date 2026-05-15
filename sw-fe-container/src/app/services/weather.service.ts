import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeatherData {
  timestamp: string;
  temperature: number;
  precipitation_probability: number;
  precipitation_amount_mm: number;
  wind_speed_kph: number;
  condition: string;
}

import { APP_CONFIG, AppConfig } from '../app-config';
import { Inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  constructor(
    private http: HttpClient,
    @Inject(APP_CONFIG) private config: AppConfig
  ) { }

  private get apiUrl() {
    return `${this.config.apiPath}/v0/weather`;
  }

  getForecast(lat: number, lon: number): Observable<WeatherData[]> {
    return this.http.get<WeatherData[]>(`${this.apiUrl}/forecast?lat=${lat}&lon=${lon}`);
  }
}
