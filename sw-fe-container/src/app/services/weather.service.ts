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

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = `${environment.apiUrl}/v0/weather`; // Note: Be needs an endpoint to serve forecast

  constructor(private http: HttpClient) { }

  getForecast(lat: number, lon: number): Observable<WeatherData[]> {
    return this.http.get<WeatherData[]>(`${this.apiUrl}/forecast?lat=${lat}&lon=${lon}`);
  }
}
