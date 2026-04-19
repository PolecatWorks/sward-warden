import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';

@Injectable({
  providedIn: 'root'
})
export class FarmManagementService {
  private apiUrl = '/v0';

  constructor(private http: HttpClient) { }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

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
