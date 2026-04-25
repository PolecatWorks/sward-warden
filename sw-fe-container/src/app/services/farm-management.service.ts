import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, shareReplay, switchMap } from 'rxjs';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { SoilAnalysis } from '../models/soil-analysis';
import { FertilisationPlan } from '../models/fertilisation-plan';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FarmManagementService {
  private apiUrl$: Observable<string>;

  constructor(private http: HttpClient, private authService: AuthService) {
    const basePath = new URL('./', import.meta.url).href;
    const configPath = basePath.endsWith('/') ? `${basePath}assets/contents/config.json` : `${basePath}/assets/contents/config.json`;
    this.apiUrl$ = this.http.get<{ apiUrl: string }>(configPath).pipe(
      map(config => config.apiUrl),
      shareReplay(1)
    );
  }

  private getHeaders(): HttpHeaders {
    const userId = this.authService.getUserId() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-User-ID': userId
    });
  }

  getUsers(): Observable<User[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<User[]>(`${apiUrl}/users`, { headers: this.getHeaders() }))
    );
  }

  getFarms(): Observable<Farm[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<Farm[]>(`${apiUrl}/farms`, { headers: this.getHeaders() }))
    );
  }

  getFields(): Observable<Field[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<Field[]>(`${apiUrl}/fields`, { headers: this.getHeaders() }))
    );
  }

  getEvents(): Observable<Event[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<Event[]>(`${apiUrl}/events`, { headers: this.getHeaders() }))
    );
  }

  addUser(user: User): Observable<User> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<User>(`${apiUrl}/users`, user, { headers: this.getHeaders() }))
    );
  }

  addFarm(farm: Farm): Observable<Farm> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<Farm>(`${apiUrl}/farms`, farm, { headers: this.getHeaders() }))
    );
  }

  addField(field: Field): Observable<Field> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<Field>(`${apiUrl}/fields`, field, { headers: this.getHeaders() }))
    );
  }

  addEvent(event: Event): Observable<Event> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<Event>(`${apiUrl}/events`, event, { headers: this.getHeaders() }))
    );
  }

  deleteFarm(id: number): Observable<void> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.delete<void>(`${apiUrl}/farms/${id}`, { headers: this.getHeaders() }))
    );
  }

  deleteField(id: number): Observable<void> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.delete<void>(`${apiUrl}/fields/${id}`, { headers: this.getHeaders() }))
    );
  }

  getSoilAnalyses(): Observable<SoilAnalysis[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<SoilAnalysis[]>(`${apiUrl}/soil_analyses`, { headers: this.getHeaders() }))
    );
  }

  addSoilAnalysis(analysis: SoilAnalysis): Observable<SoilAnalysis> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<SoilAnalysis>(`${apiUrl}/soil_analyses`, analysis, { headers: this.getHeaders() }))
    );
  }

  deleteSoilAnalysis(id: number): Observable<void> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.delete<void>(`${apiUrl}/soil_analyses/${id}`, { headers: this.getHeaders() }))
    );
  }


  getFertilisationPlans(): Observable<FertilisationPlan[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<FertilisationPlan[]>(`${apiUrl}/fertilisation_plans`, { headers: this.getHeaders() }))
    );
  }

  addFertilisationPlan(plan: FertilisationPlan): Observable<FertilisationPlan> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<FertilisationPlan>(`${apiUrl}/fertilisation_plans`, plan, { headers: this.getHeaders() }))
    );
  }

  deleteFertilisationPlan(id: number): Observable<void> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.delete<void>(`${apiUrl}/fertilisation_plans/${id}`, { headers: this.getHeaders() }))
    );
  }

}
