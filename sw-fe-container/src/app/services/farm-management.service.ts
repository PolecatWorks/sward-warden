import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, shareReplay, switchMap } from 'rxjs';
import { User } from '../models/user';
import { Farm } from '../models/farm';
import { FarmRecord } from '../models/farm-record';
import { Field } from '../models/field';
import { Event } from '../models/event';
import { FertiliserApplication } from '../models/fertiliser-application';
import { SoilAnalysis } from '../models/soil-analysis';
import { FertilisationPlan } from '../models/fertilisation-plan';
import { OrganicManureApplication } from '../models/organic-manure-application';
import { ComplianceBreach } from '../models/compliance-breach';
import { SwardMovement } from '../models/sward-movement';
import { AuthService } from './auth.service';
import { RxdbService } from './rxdb/rxdb.service';
import {
  FarmDocType, FieldDocType, EventDocType, OutboxDocType,
  SoilAnalysisDocType, FertilisationPlanDocType, OutboxEntityType, FarmRecordDocType,
  OrganicManureApplicationDocType, ComplianceBreachDocType, SwardMovementDocType,
} from './rxdb/schemas';
import { RxDocument } from 'rxdb';
import { APP_CONFIG, AppConfig } from '../app-config';
import { Inject } from '@angular/core';
import { of } from 'rxjs';

let localIdCounter = 0;
function generateLocalId(): string {
  localIdCounter = (localIdCounter + 1) % 100;
  return `-${Date.now()}${localIdCounter.toString().padStart(2, '0')}`;
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
    @Inject(APP_CONFIG) private config: AppConfig
  ) {
    this.apiUrl$ = of(this.config.apiPath).pipe(shareReplay(1));
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

  getUser(id: number | string): Observable<User> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.get<User>(`${apiUrl}/users/${id}`, { headers: this.getHeaders() }))
    );
  }

  updateUser(id: number | string, user: Partial<User>): Observable<User> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.put<User>(`${apiUrl}/users/${id}`, user, { headers: this.getHeaders() }))
    );
  }

  // ──────────────────────────────────────────────────────────
  // Local-First CRUD Logic
  // ──────────────────────────────────────────────────────────


  private insertEntity<TDoc, TModel>(
    collectionName: OutboxEntityType,
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

  private updateEntity<TDoc, TModel>(
    collectionName: OutboxEntityType,
    localId: string,
    serverId: number | string | undefined,
    updates: any,
    outboxPayload: any,
    mapper: (doc: TDoc) => TModel
  ): Observable<TModel> {
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const collection = (db as any)[collectionName];
        return from(collection.findOne({ selector: { id: localId } }).exec()).pipe(
          switchMap((doc: any) => {
            if (!doc) {
              throw new Error(`Document with localId ${localId} not found in ${collectionName}`);
            }
            const updateData = {
              ...updates,
              syncStatus: 'pending',
              updatedAt: new Date().toISOString()
            };

            return from(doc.patch(updateData)).pipe(
              switchMap((patchedDoc: any) => {
                const payload = { ...outboxPayload };
                if (serverId) {
                    payload.id = serverId;
                }
                return from(this.createOutboxEntry(db, 'PUT', collectionName, localId, payload)).pipe(
                  map(() => patchedDoc as TDoc)
                );
              })
            );
          })
        );
      }),
      map(doc => mapper(doc))
    );
  }

  /** Get all farms from the local RxDB database as a reactive observable. */
  getFarms(): Observable<Farm[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<Farm[]>(`${apiUrl}/farms`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => db.farms.find().$ as Observable<FarmDocType[]>),
      map(docs => docs.map(doc => this.farmDocToModel(doc))),
    );
  }

  /** Add a farm to the local RxDB database and queue an outbox entry. */
  addFarm(farm: Farm): Observable<Farm> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<Farm>(`${apiUrl}/farms`, farm, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<FarmDocType, Farm>(
      'farms',
      { serverId: typeof farm.id === 'number' ? farm.id : undefined, user_id: farm.user_id, name: farm.name, location: farm.location, has_derogation: farm.has_derogation },
      { name: farm.name, location: farm.location, has_derogation: farm.has_derogation },
      (doc) => this.farmDocToModel(doc)
    );
  }

  /** Get all fields from the local RxDB database. */
  getFields(): Observable<Field[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<Field[]>(`${apiUrl}/fields`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fields.find().$ as Observable<FieldDocType[]>),
      map(docs => docs.map(doc => this.fieldDocToModel(doc))),
    );
  }

  getField(id: number | string): Observable<Field | undefined> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.getFields().pipe(
        map(fields => fields.find(f => f.id === id || (typeof id === 'number' && f.id === id)))
      );
    }
    const selector = (typeof id === 'number' && id < 0)
      ? { id: id.toString() }
      : (typeof id === 'number' ? { serverId: id } : { id: id });
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fields.findOne({ selector }).$ as Observable<FieldDocType | null>),
      map(doc => doc ? this.fieldDocToModel(doc) : undefined),
    );
  }

  /** Add a field to the local RxDB database and queue an outbox entry. */
  addField(field: Field): Observable<Field> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<Field>(`${apiUrl}/fields`, field, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<FieldDocType, Field>(
      'fields',
      { serverId: typeof field.id === 'number' ? field.id : undefined, farm_id: field.farm_id, name: field.name, area_hectares: field.area_hectares, land_use: field.land_use },
      { farm_id: field.farm_id, name: field.name, area_hectares: field.area_hectares, land_use: field.land_use },
      (doc) => this.fieldDocToModel(doc)
    );
  }

  /** Get all events from the local RxDB database. */
  getEvents(): Observable<Event[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<Event[]>(`${apiUrl}/events`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => db.events.find().$ as Observable<EventDocType[]>),
      map(docs => docs.map(doc => this.eventDocToModel(doc))),
    );
  }

  /** Add an event to the local RxDB database and queue an outbox entry. */
  addEvent(event: Event): Observable<Event> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<Event>(`${apiUrl}/events`, event, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<EventDocType, Event>(
      'events',
      { serverId: typeof event.id === 'number' ? event.id : undefined, field_id: event.field_id, event_type: event.event_type, description: event.description, date: event.date },
      { field_id: event.field_id, event_type: event.event_type, description: event.description, date: event.date },
      (doc) => this.eventDocToModel(doc)
    );
  }

  /** Update an event in the local RxDB database and queue an outbox entry. */
  updateEvent(localId: string, event: Partial<Event>): Observable<Event> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.put<Event>(`${apiUrl}/events/${event.id}`, event, { headers: this.getHeaders() }))
      );
    }
    const updates: any = {};
    const outboxPayload: any = {};

    if (event.description !== undefined) updates.description = outboxPayload.description = event.description;
    if (event.date !== undefined) updates.date = outboxPayload.date = event.date;
    if (event.mapp_number !== undefined) updates.mapp_number = outboxPayload.mapp_number = event.mapp_number;
    if (event.eppo_code !== undefined) updates.eppo_code = outboxPayload.eppo_code = event.eppo_code;
    if (event.bbch_growth_stage !== undefined) updates.bbch_growth_stage = outboxPayload.bbch_growth_stage = event.bbch_growth_stage;

    return this.updateEntity<EventDocType, Event>(
      'events',
      localId,
      event.id,
      updates,
      outboxPayload,
      (doc) => this.eventDocToModel(doc)
    );
  }

  /** Get all soil analyses from the local RxDB database. */
  getSoilAnalyses(): Observable<SoilAnalysis[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<SoilAnalysis[]>(`${apiUrl}/soil_analyses`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => db.soil_analyses.find().$ as Observable<SoilAnalysisDocType[]>),
      map(docs => docs.map(doc => this.soilAnalysisDocToModel(doc))),
    );
  }

  /** Add a soil analysis to the local RxDB database and queue an outbox entry. */
  addSoilAnalysis(analysis: SoilAnalysis): Observable<SoilAnalysis> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<SoilAnalysis>(`${apiUrl}/soil_analyses`, analysis, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<SoilAnalysisDocType, SoilAnalysis>(
      'soil_analyses',
      { serverId: typeof analysis.id === 'number' ? analysis.id : undefined, field_id: analysis.field_id, sample_date: analysis.sample_date, ph_level: analysis.ph_level, phosphorus_index: analysis.phosphorus_index, potassium_index: analysis.potassium_index, magnesium_index: analysis.magnesium_index },
      { field_id: analysis.field_id, sample_date: analysis.sample_date, ph_level: analysis.ph_level, phosphorus_index: analysis.phosphorus_index, potassium_index: analysis.potassium_index, magnesium_index: analysis.magnesium_index },
      (doc) => this.soilAnalysisDocToModel(doc)
    );
  }

  /** Get all fertilisation plans from the local RxDB database. */
  getFertilisationPlans(): Observable<FertilisationPlan[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<FertilisationPlan[]>(`${apiUrl}/fertilisation_plans`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => db.fertilisation_plans.find().$ as Observable<FertilisationPlanDocType[]>),
      map(docs => docs.map(doc => this.fertilisationPlanDocToModel(doc))),
    );
  }

  /** Add a fertilisation plan to the local RxDB database and queue an outbox entry. */
  addFertilisationPlan(plan: FertilisationPlan): Observable<FertilisationPlan> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<FertilisationPlan>(`${apiUrl}/fertilisation_plans`, plan, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<FertilisationPlanDocType, FertilisationPlan>(
      'fertilisation_plans',
      { serverId: typeof plan.id === 'number' ? plan.id : undefined, field_id: plan.field_id, crop_type: plan.crop_type, target_yield: plan.target_yield, nitrogen_requirement: plan.nitrogen_requirement, phosphorus_requirement: plan.phosphorus_requirement, potassium_requirement: plan.potassium_requirement, application_date: plan.application_date },
      { field_id: plan.field_id, crop_type: plan.crop_type, target_yield: plan.target_yield, nitrogen_requirement: plan.nitrogen_requirement, phosphorus_requirement: plan.phosphorus_requirement, potassium_requirement: plan.potassium_requirement, application_date: plan.application_date },
      (doc) => this.fertilisationPlanDocToModel(doc)
    );
  }

  /** Get all farm records from the local RxDB database. */
  getFarmRecords(): Observable<FarmRecord[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<FarmRecord[]>(`${apiUrl}/farm_records`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => db.farm_records.find().$ as Observable<FarmRecordDocType[]>),
      map(docs => docs.map(doc => this.farmRecordDocToModel(doc))),
    );
  }

  /** Add a farm record to the local RxDB database and queue an outbox entry. */
  addFarmRecord(record: FarmRecord): Observable<FarmRecord> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<FarmRecord>(`${apiUrl}/farm_records`, record, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<FarmRecordDocType, FarmRecord>(
      'farm_records',
      { serverId: typeof record.id === 'number' ? record.id : undefined, farm_id: record.farm_id, agricultural_area: record.agricultural_area, manure_storage_capacity: record.manure_storage_capacity, year: record.year, has_derogation: record.has_derogation },
      { farm_id: record.farm_id, agricultural_area: record.agricultural_area, manure_storage_capacity: record.manure_storage_capacity, year: record.year, has_derogation: record.has_derogation },
      (doc) => this.farmRecordDocToModel(doc)
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

  updateFertiliserApplication(id: number | string, application: Partial<FertiliserApplication>): Observable<FertiliserApplication> {
    return this.apiUrl$.pipe(
      switchMap(apiUrl => this.http.put<FertiliserApplication>(`${apiUrl}/fertiliser_applications/${id}`, application, { headers: this.getHeaders() }))
    );
  }


  // Organic Manure Applications
  // ──────────────────────────────────────────────────────────

  getOrganicManureApplications(): Observable<OrganicManureApplication[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<OrganicManureApplication[]>(`${apiUrl}/organic-manure-applications`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => from(db.organic_manure_applications.find().$)),
      map((docs: any[]) => docs.map(doc => this.organicManureApplicationDocToModel(doc)))
    );
  }

  // ──────────────────────────────────────────────────────────
  // Delete Helpers
  // ──────────────────────────────────────────────────────────

  deleteEntity(entity: OutboxEntityType, id: number | string): Observable<void> {
    if (this.rxdbService.fallbackToRest$.value) {
      const endpointMap: Record<string, string> = {
        compliance_breaches: 'compliance-breaches',
        sward_movements: 'sward-movements',
      };
      const endpoint = endpointMap[entity] || entity;
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.delete<void>(`${apiUrl}/${endpoint}/${id}`, { headers: this.getHeaders() }))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => {
        const collection = (db as any)[entity];
        const selector = (typeof id === 'number' && id < 0)
          ? { id: id.toString() }
          : (typeof id === 'number' ? { serverId: id } : { id: id });
        return from(collection.findOne({ selector }).exec() as Promise<RxDocument<any> | null>).pipe(
          switchMap(doc => {
            if (doc) {
              const localId = doc.id;
              return from(doc.remove()).pipe(
                switchMap(() => from(this.createOutboxEntry(db, 'DELETE', entity as any, localId, { id: id })).pipe(map(() => undefined as void))),
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
    entityType: OutboxEntityType,
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
      id: doc.serverId ?? (doc.id ? Number(doc.id) : undefined),
      user_id: doc.user_id,
      name: doc.name,
      location: doc.location,
      has_derogation: doc.has_derogation,
    };
  }

  private fieldDocToModel(doc: FieldDocType): Field {
    return {
      id: doc.serverId ?? (doc.id ? Number(doc.id) : undefined),
      farm_id: doc.farm_id,
      name: doc.name,
      area_hectares: doc.area_hectares,
      land_use: doc.land_use,
    };
  }

  private eventDocToModel(doc: EventDocType): Event {
    return {
      id: doc.serverId ?? (doc.id ? Number(doc.id) : undefined),
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

  private farmRecordDocToModel(doc: FarmRecordDocType): FarmRecord {
    return {
      id: doc.serverId,
      farm_id: doc.farm_id,
      agricultural_area: doc.agricultural_area,
      manure_storage_capacity: doc.manure_storage_capacity,
      year: doc.year,
      has_derogation: doc.has_derogation,
    };
  }

  private organicManureApplicationDocToModel(doc: OrganicManureApplicationDocType): OrganicManureApplication {
    return {
      id: doc.serverId ?? 0,
      event_id: doc.event_id,
      manure_type: doc.manure_type,
      volume_applied_m3_per_ha: doc.volume_applied_m3_per_ha,
      weight_applied_tonnes_per_ha: doc.weight_applied_tonnes_per_ha,
      nitrogen_content_kg_per_unit: doc.nitrogen_content_kg_per_unit,
      is_lesse_applied: doc.is_lesse_applied,
      weather_conditions_confirmed: doc.weather_conditions_confirmed,
      buffer_zone_distance_meters: doc.buffer_zone_distance_meters,
      equipment_used: doc.equipment_used,
      lesse_exemption_reason: doc.lesse_exemption_reason,
    };
  }

  private complianceBreachDocToModel(doc: ComplianceBreachDocType): ComplianceBreach {
    return {
      id: doc.serverId ?? 0,
      farm_id: doc.farm_id,
      breach_type: doc.breach_type,
      severity: doc.severity as any,
      estimated_penalty_percentage: doc.estimated_penalty_percentage,
      mandatory_training_required: doc.mandatory_training_required,
      breach_date: doc.breach_date,
      notes: doc.notes,
      is_repeat: doc.is_repeat,
    };
  }

  getComplianceBreachesForFarm(farmId: number): Observable<ComplianceBreach[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<ComplianceBreach[]>(`${apiUrl}/compliance-breaches`, { headers: this.getHeaders() })),
        map(breaches => breaches.filter(b => b.farm_id === farmId))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => from(db.compliance_breaches.find({ selector: { farm_id: farmId } }).$)),
      map((docs: any[]) => docs.map(doc => this.complianceBreachDocToModel(doc)))
    );
  }

  addComplianceBreach(breach: ComplianceBreach): Observable<ComplianceBreach> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<ComplianceBreach>(`${apiUrl}/compliance-breaches`, breach, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<ComplianceBreachDocType, ComplianceBreach>(
      'compliance_breaches',
      {
        serverId: typeof breach.id === 'number' ? breach.id : undefined, farm_id: breach.farm_id, breach_type: breach.breach_type,
        severity: breach.severity, estimated_penalty_percentage: breach.estimated_penalty_percentage,
        mandatory_training_required: breach.mandatory_training_required, breach_date: breach.breach_date,
        notes: breach.notes, is_repeat: breach.is_repeat
      },
      {
        farm_id: breach.farm_id, breach_type: breach.breach_type, severity: breach.severity,
        estimated_penalty_percentage: breach.estimated_penalty_percentage,
        mandatory_training_required: breach.mandatory_training_required, breach_date: breach.breach_date,
        notes: breach.notes, is_repeat: breach.is_repeat
      },
      (doc) => this.complianceBreachDocToModel(doc)
    );
  }

  addOrganicManureApplication(app: OrganicManureApplication): Observable<OrganicManureApplication> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<OrganicManureApplication>(`${apiUrl}/organic-manure-applications`, app, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<OrganicManureApplicationDocType, OrganicManureApplication>(
      'organic_manure_applications',
      {
        serverId: typeof app.id === 'number' ? app.id : undefined, event_id: app.event_id, manure_type: app.manure_type,
        volume_applied_m3_per_ha: app.volume_applied_m3_per_ha, weight_applied_tonnes_per_ha: app.weight_applied_tonnes_per_ha,
        nitrogen_content_kg_per_unit: app.nitrogen_content_kg_per_unit, is_lesse_applied: app.is_lesse_applied,
        weather_conditions_confirmed: app.weather_conditions_confirmed, buffer_zone_distance_meters: app.buffer_zone_distance_meters,
        equipment_used: app.equipment_used, lesse_exemption_reason: app.lesse_exemption_reason
      },
      {
        event_id: app.event_id, manure_type: app.manure_type, volume_applied_m3_per_ha: app.volume_applied_m3_per_ha,
        weight_applied_tonnes_per_ha: app.weight_applied_tonnes_per_ha, nitrogen_content_kg_per_unit: app.nitrogen_content_kg_per_unit,
        is_lesse_applied: app.is_lesse_applied, weather_conditions_confirmed: app.weather_conditions_confirmed,
        buffer_zone_distance_meters: app.buffer_zone_distance_meters,
        equipment_used: app.equipment_used, lesse_exemption_reason: app.lesse_exemption_reason
      },
      (doc) => this.organicManureApplicationDocToModel(doc)
    );
  }

  updateOrganicManureApplication(localId: string, serverId: number | string | undefined, app: Partial<OrganicManureApplication>): Observable<OrganicManureApplication> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.put<OrganicManureApplication>(`${apiUrl}/organic-manure-applications/${serverId}`, app, { headers: this.getHeaders() }))
      );
    }
    const updates: any = {};
    const outboxPayload: any = {};

    if (app.manure_type !== undefined) updates.manure_type = outboxPayload.manure_type = app.manure_type;
    if (app.volume_applied_m3_per_ha !== undefined) updates.volume_applied_m3_per_ha = outboxPayload.volume_applied_m3_per_ha = app.volume_applied_m3_per_ha;
    if (app.weight_applied_tonnes_per_ha !== undefined) updates.weight_applied_tonnes_per_ha = outboxPayload.weight_applied_tonnes_per_ha = app.weight_applied_tonnes_per_ha;
    if (app.nitrogen_content_kg_per_unit !== undefined) updates.nitrogen_content_kg_per_unit = outboxPayload.nitrogen_content_kg_per_unit = app.nitrogen_content_kg_per_unit;
    if (app.is_lesse_applied !== undefined) updates.is_lesse_applied = outboxPayload.is_lesse_applied = app.is_lesse_applied;
    if (app.weather_conditions_confirmed !== undefined) updates.weather_conditions_confirmed = outboxPayload.weather_conditions_confirmed = app.weather_conditions_confirmed;
    if (app.buffer_zone_distance_meters !== undefined) updates.buffer_zone_distance_meters = outboxPayload.buffer_zone_distance_meters = app.buffer_zone_distance_meters;
    if (app.equipment_used !== undefined) updates.equipment_used = outboxPayload.equipment_used = app.equipment_used;
    if (app.lesse_exemption_reason !== undefined) updates.lesse_exemption_reason = outboxPayload.lesse_exemption_reason = app.lesse_exemption_reason;

    return this.updateEntity<OrganicManureApplicationDocType, OrganicManureApplication>(
      'organic_manure_applications',
      localId,
      serverId,
      updates,
      outboxPayload,
      (doc) => this.organicManureApplicationDocToModel(doc)
    );
  }


  getSwardMovementsForFarm(farmId: number): Observable<SwardMovement[]> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.get<SwardMovement[]>(`${apiUrl}/sward-movements`, { headers: this.getHeaders() })),
        map(movements => movements.filter(m => m.farm_id === farmId))
      );
    }
    return this.rxdbService.db$.pipe(
      switchMap(db => from(db.sward_movements.find({ selector: { farm_id: farmId } }).$)),
      map((docs: any[]) => docs.map(doc => this.swardMovementDocToModel(doc)))
    );
  }

  addSwardMovement(movement: SwardMovement): Observable<SwardMovement> {
    if (this.rxdbService.fallbackToRest$.value) {
      return this.apiUrl$.pipe(
        switchMap(apiUrl => this.http.post<SwardMovement>(`${apiUrl}/sward-movements`, movement, { headers: this.getHeaders() }))
      );
    }
    return this.insertEntity<SwardMovementDocType, SwardMovement>(
      'sward_movements',
      {
        serverId: typeof movement.id === 'number' ? movement.id : undefined, farm_id: movement.farm_id as any, movement_type: movement.movement_type,
        quantity_m3: movement.quantity_m3, date: movement.date, manure_type: movement.manure_type,
        consignee_name: movement.consignee_name, consignee_address: movement.consignee_address,
        consignor_name: movement.consignor_name, consignor_address: movement.consignor_address,
        transporter_name: movement.transporter_name, contract_length_months: movement.contract_length_months
      },
      {
        farm_id: movement.farm_id as any, movement_type: movement.movement_type,
        quantity_m3: movement.quantity_m3, date: movement.date, manure_type: movement.manure_type,
        consignee_name: movement.consignee_name, consignee_address: movement.consignee_address,
        consignor_name: movement.consignor_name, consignor_address: movement.consignor_address,
        transporter_name: movement.transporter_name, contract_length_months: movement.contract_length_months
      },
      (doc) => this.swardMovementDocToModel(doc)
    );
  }

  private swardMovementDocToModel(doc: SwardMovementDocType): SwardMovement {
    return {
      id: doc.serverId ?? (doc.id ? Number(doc.id) : undefined),
      farm_id: doc.farm_id,
      movement_type: doc.movement_type as any,
      quantity_m3: doc.quantity_m3,
      date: doc.date,
      manure_type: doc.manure_type,
      consignee_name: doc.consignee_name,
      consignee_address: doc.consignee_address,
      consignor_name: doc.consignor_name,
      consignor_address: doc.consignor_address,
      transporter_name: doc.transporter_name,
      contract_length_months: doc.contract_length_months,
      updated_at: doc.updatedAt,
    };
  }
}
