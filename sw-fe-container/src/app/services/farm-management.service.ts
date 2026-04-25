import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, shareReplay, switchMap } from 'rxjs';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { SoilAnalysis } from '../models/soil-analysis';
import { FertilisationPlan } from '../models/fertilisation-plan';
import { AuthService } from './auth.service';
import { RxdbService } from './rxdb/rxdb.service';
import {
  FarmDocType, FieldDocType, EventDocType, OutboxDocType,
  SoilAnalysisDocType, FertilisationPlanDocType,
} from './rxdb/schemas';
import { RxDocument } from 'rxdb';

/** Generates a short unique ID for local-first record creation. */
function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

@Injectable({
  providedIn: 'root'
})
export class FarmManagementService {
  readonly apiUrl$: Observable<string>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private rxdbService: RxdbService,
  ) {
    const configPath = 'assets/contents/config.json';
    this.apiUrl$ = this.http.get<{ apiUrl: string }>(configPath).pipe(
      map(config => config.apiUrl),
      shareReplay(1)
    );
  }

  getHeaders(): HttpHeaders {
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

  addUser(user: User): Observable<User> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<User>(`${apiUrl}/users`, user, { headers: this.getHeaders() }))
    );
  }

  // ──────────────────────────────────────────────────────────
  // Local-First CRUD Logic
  // ──────────────────────────────────────────────────────────

  getFarms(): Observable<Farm[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.farms.find().$ as Observable<FarmDocType[]>),
      map(docs => docs.map(doc => this.farmDocToModel(doc))),
    );
  }

  addFarm(farm: Farm): Observable<Farm> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const localId = generateLocalId();
        return from(db.farms.insert({
          id: localId, serverId: farm.id, user_id: farm.user_id, name: farm.name,
          location: farm.location, syncStatus: 'pending', updatedAt: new Date().toISOString(),
        })).pipe(
          switchMap(doc => from(this.createOutboxEntry(db, 'POST', 'farms', localId, { name: farm.name, location: farm.location })).pipe(map(() => doc))),
        );
      }),
      map(doc => this.farmDocToModel(doc)),
    );
  }

  getFields(): Observable<Field[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fields.find().$ as Observable<FieldDocType[]>),
      map(docs => docs.map(doc => this.fieldDocToModel(doc))),
    );
  }

  addField(field: Field): Observable<Field> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const localId = generateLocalId();
        return from(db.fields.insert({
          id: localId, serverId: field.id, farm_id: field.farm_id, name: field.name,
          area_hectares: field.area_hectares, syncStatus: 'pending', updatedAt: new Date().toISOString(),
        })).pipe(
          switchMap(doc => from(this.createOutboxEntry(db, 'POST', 'fields', localId, { farm_id: field.farm_id, name: field.name, area_hectares: field.area_hectares })).pipe(map(() => doc))),
        );
      }),
      map(doc => this.fieldDocToModel(doc)),
    );
  }

  getEvents(): Observable<Event[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.events.find().$ as Observable<EventDocType[]>),
      map(docs => docs.map(doc => this.eventDocToModel(doc))),
    );
  }

  addEvent(event: Event): Observable<Event> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const localId = generateLocalId();
        return from(db.events.insert({
          id: localId, serverId: event.id, field_id: event.field_id, event_type: event.event_type,
          description: event.description, date: event.date, syncStatus: 'pending', updatedAt: new Date().toISOString(),
        })).pipe(
          switchMap(doc => from(this.createOutboxEntry(db, 'POST', 'events', localId, { field_id: event.field_id, event_type: event.event_type, description: event.description, date: event.date })).pipe(map(() => doc))),
        );
      }),
      map(doc => this.eventDocToModel(doc)),
    );
  }

  getSoilAnalyses(): Observable<SoilAnalysis[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.soil_analyses.find().$ as Observable<SoilAnalysisDocType[]>),
      map(docs => docs.map(doc => this.soilAnalysisDocToModel(doc))),
    );
  }

  addSoilAnalysis(analysis: SoilAnalysis): Observable<SoilAnalysis> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const localId = generateLocalId();
        return from(db.soil_analyses.insert({
          id: localId, serverId: analysis.id, field_id: analysis.field_id, sample_date: analysis.sample_date,
          ph_level: analysis.ph_level, phosphorus_index: analysis.phosphorus_index, potassium_index: analysis.potassium_index,
          magnesium_index: analysis.magnesium_index, syncStatus: 'pending', updatedAt: new Date().toISOString(),
        })).pipe(
          switchMap(doc => from(this.createOutboxEntry(db, 'POST', 'soil_analyses', localId, { field_id: analysis.field_id, sample_date: analysis.sample_date, ph_level: analysis.ph_level, phosphorus_index: analysis.phosphorus_index, potassium_index: analysis.potassium_index, magnesium_index: analysis.magnesium_index })).pipe(map(() => doc))),
        );
      }),
      map(doc => this.soilAnalysisDocToModel(doc)),
    );
  }

  getFertilisationPlans(): Observable<FertilisationPlan[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fertilisation_plans.find().$ as Observable<FertilisationPlanDocType[]>),
      map(docs => docs.map(doc => this.fertilisationPlanDocToModel(doc))),
    );
  }

  addFertilisationPlan(plan: FertilisationPlan): Observable<FertilisationPlan> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const localId = generateLocalId();
        return from(db.fertilisation_plans.insert({
          id: localId, serverId: plan.id, field_id: plan.field_id, crop_type: plan.crop_type,
          target_yield: plan.target_yield, nitrogen_requirement: plan.nitrogen_requirement,
          phosphorus_requirement: plan.phosphorus_requirement, potassium_requirement: plan.potassium_requirement,
          application_date: plan.application_date, syncStatus: 'pending', updatedAt: new Date().toISOString(),
        })).pipe(
          switchMap(doc => from(this.createOutboxEntry(db, 'POST', 'fertilisation_plans', localId, { field_id: plan.field_id, crop_type: plan.crop_type, target_yield: plan.target_yield, nitrogen_requirement: plan.nitrogen_requirement, phosphorus_requirement: plan.phosphorus_requirement, potassium_requirement: plan.potassium_requirement, application_date: plan.application_date })).pipe(map(() => doc))),
        );
      }),
      map(doc => this.fertilisationPlanDocToModel(doc)),
    );
  }

  // ──────────────────────────────────────────────────────────
  // Delete Helpers
  // ──────────────────────────────────────────────────────────

  deleteFarm(id: number): Observable<void> { return this.deleteByServerId('farms', id); }
  deleteField(id: number): Observable<void> { return this.deleteByServerId('fields', id); }
  deleteSoilAnalysis(id: number): Observable<void> { return this.deleteByServerId('soil_analyses', id); }
  deleteFertilisationPlan(id: number): Observable<void> { return this.deleteByServerId('fertilisation_plans', id); }

  private deleteByServerId(entity: string, serverId: number): Observable<void> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const collection = (db as any)[entity];
        return from(collection.find({ selector: { serverId } }).exec() as Promise<RxDocument<any>[]>).pipe(
          switchMap(docs => {
            if (docs.length > 0) {
              const localId = docs[0].id;
              return from(docs[0].remove()).pipe(
                switchMap(() => from(this.createOutboxEntry(db, 'DELETE', entity as any, localId, { id: serverId })).pipe(map(() => undefined as void))),
              );
            }
            return from(Promise.resolve(undefined as void));
          }),
        );
      }),
    );
  }

  // ──────────────────────────────────────────────────────────
  // Outbox helper
  // ──────────────────────────────────────────────────────────

  private async createOutboxEntry(
    db: any, actionType: 'POST' | 'PUT' | 'DELETE',
    entityType: 'farms' | 'fields' | 'events' | 'soil_analyses' | 'fertilisation_plans', localDocId: string, payload: object,
  ): Promise<void> {
    await db.outbox.insert({
      id: generateLocalId(), actionType, entityType, localDocId,
      payload: JSON.stringify(payload), timestamp: new Date().toISOString(),
      status: 'pending', retryCount: 0,
    } satisfies OutboxDocType);
  }

  // ──────────────────────────────────────────────────────────
  // Mapping helpers
  // ──────────────────────────────────────────────────────────

  private farmDocToModel(doc: FarmDocType): Farm { return { id: doc.serverId, user_id: doc.user_id, name: doc.name, location: doc.location }; }
  private fieldDocToModel(doc: FieldDocType): Field { return { id: doc.serverId ?? 0, farm_id: doc.farm_id, name: doc.name, area_hectares: doc.area_hectares }; }
  private eventDocToModel(doc: EventDocType): Event { return { id: doc.serverId ?? 0, field_id: doc.field_id, event_type: doc.event_type, description: doc.description, date: doc.date }; }
  private soilAnalysisDocToModel(doc: SoilAnalysisDocType): SoilAnalysis {
    return {
      id: doc.serverId ?? 0, field_id: doc.field_id, sample_date: doc.sample_date,
      ph_level: doc.ph_level, phosphorus_index: doc.phosphorus_index,
      potassium_index: doc.potassium_index, magnesium_index: doc.magnesium_index,
    };
  }
  private fertilisationPlanDocToModel(doc: FertilisationPlanDocType): FertilisationPlan {
    return {
      id: doc.serverId ?? 0, field_id: doc.field_id, crop_type: doc.crop_type,
      target_yield: doc.target_yield, nitrogen_requirement: doc.nitrogen_requirement,
      phosphorus_requirement: doc.phosphorus_requirement, potassium_requirement: doc.potassium_requirement,
      application_date: doc.application_date,
    };
  }
}
