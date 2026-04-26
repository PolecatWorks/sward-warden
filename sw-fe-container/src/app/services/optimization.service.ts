import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OptimizationSuggestion {
  field_id: number;
  field_name: string;
  recommended_rate: number;
  unit: string;
  nutrient_met: string;
  score: number;
  reasoning: string;
}

export interface OptimizationPlan {
  farm_id: number;
  suggestions: OptimizationSuggestion[];
}

@Injectable({
  providedIn: 'root'
})
export class OptimizationService {
  private apiUrl = `${environment.apiUrl}/v0/optimization`;

  constructor(private http: HttpClient) { }

  getSuggestions(farmId: number): Observable<OptimizationPlan> {
    return this.http.get<OptimizationPlan>(`${this.apiUrl}/suggestions/${farmId}`);
  }
}
