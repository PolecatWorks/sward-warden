import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, shareReplay, switchMap } from 'rxjs';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { AuthService } from './auth.service';
import { RxdbService } from './rxdb/rxdb.service';
import { FarmDocType, FieldDocType, EventDocType } from './rxdb/schemas';

/**
 * Generates a short unique ID for local-first record creation.
 * In production, crypto.randomUUID() is preferred but this is
 * compatible with all environments including tests.
 */
function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

@Injectable({
  providedIn: 'root'
})
export class FarmManagementService {
  private apiUrl$: Observable<string>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private rxdbService: RxdbService,
  ) {
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

  // ──────────────────────────────────────────────────────────
  // Users — still HTTP-only (no local schema for users yet)
  // ──────────────────────────────────────────────────────────

  getUsers(): Observable<User[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<User[]>(`${apiUrl}/users`, { headers: this.getHeaders() }))
    );
  }

  addUser(user: User): Observable<User> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<User>(`${apiUrl}/users`, user, { headers: this.getHeaders() }))
    );
  }

  // ──────────────────────────────────────────────────────────
  // Farms — local-first via RxDB
  // ──────────────────────────────────────────────────────────

  /** Get all farms from the local RxDB database as a reactive observable. */
  getFarms(): Observable<Farm[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.farms.find().$ as Observable<FarmDocType[]>),
      map(docs => docs.map(doc => this.farmDocToModel(doc))),
    );
  }

  /** Add a farm to the local RxDB database. */
  addFarm(farm: Farm): Observable<Farm> {
    return this.rxdbService.db$.pipe(
      switchMap(db => from(db.farms.insert({
        id: generateLocalId(),
        serverId: farm.id,
        user_id: farm.user_id,
        name: farm.name,
        location: farm.location,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      }))),
      map(doc => this.farmDocToModel(doc)),
    );
  }

  /** Delete a farm from the local RxDB database by its local ID. */
  deleteFarm(id: number): Observable<void> {
    return this.rxdbService.db$.pipe(
      switchMap(db =>
        from(db.farms.find({ selector: { serverId: id } }).exec())
      ),
      switchMap(docs => {
        if (docs.length > 0) {
          return from(docs[0].remove()).pipe(map(() => undefined as void));
        }
        return from(Promise.resolve(undefined as void));
      }),
    );
  }

  // ──────────────────────────────────────────────────────────
  // Fields — local-first via RxDB
  // ──────────────────────────────────────────────────────────

  /** Get all fields from the local RxDB database. */
  getFields(): Observable<Field[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fields.find().$ as Observable<FieldDocType[]>),
      map(docs => docs.map(doc => this.fieldDocToModel(doc))),
    );
  }

  /** Add a field to the local RxDB database. */
  addField(field: Field): Observable<Field> {
    return this.rxdbService.db$.pipe(
      switchMap(db => from(db.fields.insert({
        id: generateLocalId(),
        serverId: field.id,
        farm_id: field.farm_id,
        name: field.name,
        area_hectares: field.area_hectares,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      }))),
      map(doc => this.fieldDocToModel(doc)),
    );
  }

  /** Delete a field from the local RxDB database by its server ID. */
  deleteField(id: number): Observable<void> {
    return this.rxdbService.db$.pipe(
      switchMap(db =>
        from(db.fields.find({ selector: { serverId: id } }).exec())
      ),
      switchMap(docs => {
        if (docs.length > 0) {
          return from(docs[0].remove()).pipe(map(() => undefined as void));
        }
        return from(Promise.resolve(undefined as void));
      }),
    );
  }

  // ──────────────────────────────────────────────────────────
  // Events — local-first via RxDB
  // ──────────────────────────────────────────────────────────

  /** Get all events from the local RxDB database. */
  getEvents(): Observable<Event[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.events.find().$ as Observable<EventDocType[]>),
      map(docs => docs.map(doc => this.eventDocToModel(doc))),
    );
  }

  /** Add an event to the local RxDB database. */
  addEvent(event: Event): Observable<Event> {
    return this.rxdbService.db$.pipe(
      switchMap(db => from(db.events.insert({
        id: generateLocalId(),
        serverId: event.id,
        field_id: event.field_id,
        event_type: event.event_type,
        description: event.description,
        date: event.date,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      }))),
      map(doc => this.eventDocToModel(doc)),
    );
  }

  // ──────────────────────────────────────────────────────────
  // HTTP helpers — exposed for the future sync engine
  // ──────────────────────────────────────────────────────────

  /** POST a farm to the backend API (used by the sync engine). */
  httpAddFarm(farm: Farm): Observable<Farm> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<Farm>(`${apiUrl}/farms`, farm, { headers: this.getHeaders() }))
    );
  }

  /** DELETE a farm on the backend API (used by the sync engine). */
  httpDeleteFarm(id: number): Observable<void> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.delete<void>(`${apiUrl}/farms/${id}`, { headers: this.getHeaders() }))
    );
  }

  // ──────────────────────────────────────────────────────────
  // Mapping helpers
  // ──────────────────────────────────────────────────────────

  private farmDocToModel(doc: FarmDocType): Farm {
    return {
      id: doc.serverId,
      user_id: doc.user_id,
      name: doc.name,
      location: doc.location,
    };
  }

  private fieldDocToModel(doc: FieldDocType): Field {
    return {
      id: doc.serverId ?? 0,
      farm_id: doc.farm_id,
      name: doc.name,
      area_hectares: doc.area_hectares,
    };
  }

  private eventDocToModel(doc: EventDocType): Event {
    return {
      id: doc.serverId ?? 0,
      field_id: doc.field_id,
      event_type: doc.event_type,
      description: doc.description,
      date: doc.date,
    };
  }
}
