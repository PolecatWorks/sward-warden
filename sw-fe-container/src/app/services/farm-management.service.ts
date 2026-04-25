import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, shareReplay, switchMap } from 'rxjs';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { FertiliserApplication } from '../models/fertiliser-application';
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
  /** The resolved API URL, shared for use by the sync engine. */
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
  // Local-First CRUD Logic
  // ──────────────────────────────────────────────────────────


  private insertEntity<TDoc, TModel>(
    collectionName: 'farms' | 'fields' | 'events' | 'soil_analyses' | 'fertilisation_plans',
    entityData: any,
    outboxPayload: any,
    mapper: (doc: TDoc) => TModel
  ): Observable<TModel> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const localId = generateLocalId();
        const docData = {
          ...entityData,
          id: localId,
          syncStatus: 'pending',
          updatedAt: new Date().toISOString(),
        };
        const collection = (db as any)[collectionName];
        return from(collection.insert(docData)).pipe(
          switchMap((doc: any) =>
            from(this.createOutboxEntry(db, 'POST', collectionName, localId, outboxPayload)).pipe(
              map(() => doc as TDoc),
            )
          ),
        );
      }),
      map(doc => mapper(doc)),
    );
  }

  /** Get all farms from the local RxDB database as a reactive observable. */
  getFarms(): Observable<Farm[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.farms.find().$ as Observable<FarmDocType[]>),
      map(docs => docs.map(doc => this.farmDocToModel(doc))),
    );
  }

  /** Add a farm to the local RxDB database and queue an outbox entry. */
  addFarm(farm: Farm): Observable<Farm> {
    return this.insertEntity<FarmDocType, Farm>(
      'farms',
      { serverId: farm.id, user_id: farm.user_id, name: farm.name, location: farm.location },
      { name: farm.name, location: farm.location },
      (doc) => this.farmDocToModel(doc)
    );
  }

  /** Get all fields from the local RxDB database. */
  getFields(): Observable<Field[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fields.find().$ as Observable<FieldDocType[]>),
      map(docs => docs.map(doc => this.fieldDocToModel(doc))),
    );
  }

  /** Add a field to the local RxDB database and queue an outbox entry. */
  addField(field: Field): Observable<Field> {
    return this.insertEntity<FieldDocType, Field>(
      'fields',
      { serverId: field.id, farm_id: field.farm_id, name: field.name, area_hectares: field.area_hectares },
      { farm_id: field.farm_id, name: field.name, area_hectares: field.area_hectares },
      (doc) => this.fieldDocToModel(doc)
    );
  }

  /** Get all events from the local RxDB database. */
  getEvents(): Observable<Event[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.events.find().$ as Observable<EventDocType[]>),
      map(docs => docs.map(doc => this.eventDocToModel(doc))),
    );
  }

  /** Add an event to the local RxDB database and queue an outbox entry. */
  addEvent(event: Event): Observable<Event> {
    return this.insertEntity<EventDocType, Event>(
      'events',
      { serverId: event.id, field_id: event.field_id, event_type: event.event_type, description: event.description, date: event.date },
      { field_id: event.field_id, event_type: event.event_type, description: event.description, date: event.date },
      (doc) => this.eventDocToModel(doc)
    );
  }

  /** Get all soil analyses from the local RxDB database. */
  getSoilAnalyses(): Observable<SoilAnalysis[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.soil_analyses.find().$ as Observable<SoilAnalysisDocType[]>),
      map(docs => docs.map(doc => this.soilAnalysisDocToModel(doc))),
    );
  }

  /** Add a soil analysis to the local RxDB database and queue an outbox entry. */
  addSoilAnalysis(analysis: SoilAnalysis): Observable<SoilAnalysis> {
    return this.insertEntity<SoilAnalysisDocType, SoilAnalysis>(
      'soil_analyses',
      { serverId: analysis.id, field_id: analysis.field_id, sample_date: analysis.sample_date, ph_level: analysis.ph_level, phosphorus_index: analysis.phosphorus_index, potassium_index: analysis.potassium_index, magnesium_index: analysis.magnesium_index },
      { field_id: analysis.field_id, sample_date: analysis.sample_date, ph_level: analysis.ph_level, phosphorus_index: analysis.phosphorus_index, potassium_index: analysis.potassium_index, magnesium_index: analysis.magnesium_index },
      (doc) => this.soilAnalysisDocToModel(doc)
    );
  }

  /** Get all fertilisation plans from the local RxDB database. */
  getFertilisationPlans(): Observable<FertilisationPlan[]> {
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fertilisation_plans.find().$ as Observable<FertilisationPlanDocType[]>),
      map(docs => docs.map(doc => this.fertilisationPlanDocToModel(doc))),
    );
  }

  /** Add a fertilisation plan to the local RxDB database and queue an outbox entry. */
  addFertilisationPlan(plan: FertilisationPlan): Observable<FertilisationPlan> {
    return this.insertEntity<FertilisationPlanDocType, FertilisationPlan>(
      'fertilisation_plans',
      { serverId: plan.id, field_id: plan.field_id, crop_type: plan.crop_type, target_yield: plan.target_yield, nitrogen_requirement: plan.nitrogen_requirement, phosphorus_requirement: plan.phosphorus_requirement, potassium_requirement: plan.potassium_requirement, application_date: plan.application_date },
      { field_id: plan.field_id, crop_type: plan.crop_type, target_yield: plan.target_yield, nitrogen_requirement: plan.nitrogen_requirement, phosphorus_requirement: plan.phosphorus_requirement, potassium_requirement: plan.potassium_requirement, application_date: plan.application_date },
      (doc) => this.fertilisationPlanDocToModel(doc)
    );
  }

  // ──────────────────────────────────────────────────────────
  // Fertiliser Applications (Still HTTP-only for now)
  // ──────────────────────────────────────────────────────────

  getFertiliserApplications(): Observable<FertiliserApplication[]> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<FertiliserApplication[]>(`${apiUrl}/fertiliser_applications`, { headers: this.getHeaders() }))
    );
  }

  addFertiliserApplication(application: FertiliserApplication): Observable<FertiliserApplication> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.post<FertiliserApplication>(`${apiUrl}/fertiliser_applications`, application, { headers: this.getHeaders() }))
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
    db: any,
    actionType: 'POST' | 'PUT' | 'DELETE',
    entityType: 'farms' | 'fields' | 'events' | 'soil_analyses' | 'fertilisation_plans',
    localDocId: string,
    payload: object,
  ): Promise<void> {
    await db.outbox.insert({
      id: generateLocalId(),
      actionType,
      entityType,
      localDocId,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    } satisfies OutboxDocType);
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
