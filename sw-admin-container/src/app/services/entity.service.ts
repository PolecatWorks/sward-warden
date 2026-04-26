import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Farm {
  id: number;
  user_id: number;
  name: string;
  location: string;
}

export interface Field {
  id: number;
  farm_id: number;
  name: string;
  area_hectares: number;
}

export interface Event {
  id: number;
  field_id: number;
  event_type: string;
  description: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class EntityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v0/admin';

  getFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.apiUrl}/farms`);
  }

  getFields(): Observable<Field[]> {
    return this.http.get<Field[]>(`${this.apiUrl}/fields`);
  }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events`);
  }
}
