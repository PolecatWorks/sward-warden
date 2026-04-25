import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription, firstValueFrom, filter, switchMap, from, timer, merge } from 'rxjs';
import { RxdbService, SwardDatabase } from './rxdb/rxdb.service';
import { NetworkService } from './network.service';
import { SyncStateService } from './sync-state.service';
import { FarmManagementService } from './farm-management.service';
import { OutboxDocType } from './rxdb/schemas';

/** Maximum retry attempts before marking an outbox entry as permanently failed. */
const MAX_RETRIES = 3;

/** Periodic sync interval in milliseconds (default: 5 minutes). */
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/** Metadata key used to store the last successful sync checkpoint. */
const CHECKPOINT_KEY = 'lastSyncCheckpoint';

/** Response shape from the backend delta sync endpoint. */
interface SyncResponse {
  checkpoint: string;
  farms: any[];
  fields: any[];
  events: any[];
  farm_records: any[];
  soil_analyses: any[];
  fertilisation_plans: any[];
}

/**
 * Service responsible for bi-directional sync:
 * - Push: process the outbox queue (offline writes → backend)
 * - Pull: fetch delta changes from backend → local RxDB
 *
 * Sync is triggered on:
 * - Application startup (if online)
 * - Network transitions from offline → online
 * - Periodic timer (every 5 minutes while online)
 */
@Injectable({
  providedIn: 'root'
})
export class SyncEngineService implements OnDestroy {
  private subscription: Subscription;
  private syncInProgress = false;

  constructor(
    private rxdbService: RxdbService,
    private networkService: NetworkService,
    private syncStateService: SyncStateService,
    private farmService: FarmManagementService,
    private http: HttpClient,
  ) {
    // Sync triggers: online events + periodic timer
    const onlineEvent$ = this.networkService.isOnline$.pipe(
      filter(online => online),
    );

    const periodicSync$ = timer(0, SYNC_INTERVAL_MS).pipe(
      switchMap(() => this.networkService.isOnline$),
      filter(online => online),
    );

    this.subscription = merge(onlineEvent$, periodicSync$).pipe(
      switchMap(() => from(this.fullSync())),
    ).subscribe();
  }

  /**
   * Perform a full sync cycle:
   * 1. Push: flush the outbox queue
   * 2. Pull: fetch delta changes from the backend
   */
  async fullSync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      await this.processOutbox();
      await this.pullSync();
    } finally {
      this.syncInProgress = false;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Push Sync (Outbox Processing)
  // ──────────────────────────────────────────────────────────

  /** Process all pending outbox entries in chronological order. */
  async processOutbox(): Promise<void> {
    const db = await firstValueFrom(this.rxdbService.db$);
    const pendingEntries = await db.outbox.find({
      selector: { status: 'pending' },
      sort: [{ timestamp: 'asc' }],
    }).exec();

    if (pendingEntries.length === 0) {
      return;
    }

    this.syncStateService.setSyncing();

    const apiUrl = await firstValueFrom(this.farmService.apiUrl$);
    const headers = this.farmService.getHeaders();

    for (const entry of pendingEntries) {
      try {
        await this.processEntry(entry, apiUrl, headers, db);
        await entry.remove();
      } catch (error) {
        const newRetryCount = (entry.retryCount || 0) + 1;
        if (newRetryCount >= MAX_RETRIES) {
          await entry.patch({ status: 'failed', retryCount: newRetryCount });
          await this.updateLocalDocStatus(db, entry.entityType, entry.localDocId, 'failed');
        } else {
          await entry.patch({ retryCount: newRetryCount });
        }
      }
    }

    this.syncStateService.setSynced();
  }

  /** Execute the HTTP request for a single outbox entry. */
  private async processEntry(
    entry: any,
    apiUrl: string,
    headers: HttpHeaders,
    db: SwardDatabase,
  ): Promise<void> {
    const payload = JSON.parse(entry.payload);

    switch (entry.actionType) {
      case 'POST': {
        const response = await firstValueFrom(
          this.http.post<any>(`${apiUrl}/${entry.entityType}`, payload, { headers })
        );
        if (response?.id) {
          await this.updateLocalDocServerId(db, entry.entityType, entry.localDocId, response.id);
        }
        break;
      }
      case 'DELETE': {
        const serverId = payload.id;
        if (serverId) {
          await firstValueFrom(
            this.http.delete(`${apiUrl}/${entry.entityType}/${serverId}`, { headers })
          );
        }
        break;
      }
      case 'PUT': {
        const serverId = payload.id;
        if (serverId) {
          await firstValueFrom(
            this.http.put(`${apiUrl}/${entry.entityType}/${serverId}`, payload, { headers })
          );
        }
        break;
      }
    }
  }

  // ──────────────────────────────────────────────────────────
  // Pull Sync (Delta Fetch)
  // ──────────────────────────────────────────────────────────

  /** Fetch changed records from the backend and upsert into local RxDB. */
  async pullSync(): Promise<void> {
    const db = await firstValueFrom(this.rxdbService.db$);
    const apiUrl = await firstValueFrom(this.farmService.apiUrl$);
    const headers = this.farmService.getHeaders();

    // Read checkpoint
    const checkpoint = await this.getCheckpoint(db);

    // Build the sync URL
    let syncUrl = `${apiUrl}/sync`;
    if (checkpoint) {
      syncUrl += `?since=${encodeURIComponent(checkpoint)}`;
    }

    this.syncStateService.setSyncing();

    try {
      const response = await firstValueFrom(
        this.http.get<SyncResponse>(syncUrl, { headers })
      );

      // Process each entity type
      await this.upsertFarms(db, response.farms || []);
      await this.upsertFields(db, response.fields || []);
      await this.upsertEvents(db, response.events || []);
      await this.upsertSoilAnalyses(db, response.soil_analyses || []);
      await this.upsertFertilisationPlans(db, response.fertilisation_plans || []);

      // Update checkpoint
      if (response.checkpoint) {
        await this.setCheckpoint(db, response.checkpoint);
      }
    } finally {
      this.syncStateService.setSynced();
    }
  }

  // ──────────────────────────────────────────────────────────
  // Checkpoint Management
  // ──────────────────────────────────────────────────────────

  /** Get the last sync checkpoint from the metadata collection. */
  async getCheckpoint(db: SwardDatabase): Promise<string | null> {
    const doc = await (db as any).metadata.findOne(CHECKPOINT_KEY).exec();
    return doc?.value ?? null;
  }

  /** Set the sync checkpoint in the metadata collection. */
  async setCheckpoint(db: SwardDatabase, checkpoint: string): Promise<void> {
    await (db as any).metadata.upsert({
      key: CHECKPOINT_KEY,
      value: checkpoint,
    });
  }

  // ──────────────────────────────────────────────────────────
  // Upsert Logic with LWW Conflict Resolution (Optimized)
  // ──────────────────────────────────────────────────────────

  /** Upsert farms from the server into local RxDB. */
  private async upsertFarms(db: SwardDatabase, serverFarms: any[]): Promise<void> {
    if (!serverFarms || serverFarms.length === 0) return;

    const serverIds = serverFarms.map(s => s.id);
    const existingDocsArray = await db.farms.find({
      selector: { serverId: { $in: serverIds } }
    }).exec();

    const existingDocsMap = new Map();
    for (const doc of existingDocsArray) {
      existingDocsMap.set(doc.serverId, doc);
    }

    const localDocIds = existingDocsArray.map(doc => doc.id);
    const outboxEntriesArray = await db.outbox.find({
      selector: { localDocId: { $in: localDocIds }, status: 'pending' }
    }).exec();

    const pendingOutboxMap = new Set();
    for (const entry of outboxEntriesArray) {
      pendingOutboxMap.add(entry.localDocId);
    }

    const toUpsert = [];
    const toRemove = [];

    for (const serverFarm of serverFarms) {
      const localDoc = existingDocsMap.get(serverFarm.id);

      if (serverFarm.is_deleted) {
        if (localDoc) toRemove.push(localDoc);
        continue;
      }

      if (localDoc) {
        const hasPending = pendingOutboxMap.has(localDoc.id);
        if (this.shouldOverwriteLocal(localDoc.updatedAt, serverFarm.updated_at, hasPending)) {
          await localDoc.patch({
            name: serverFarm.name,
            location: serverFarm.location,
            updatedAt: serverFarm.updated_at,
            syncStatus: 'synced' as any,
          });
        }
      } else {
        toUpsert.push({
          id: `server-${serverFarm.id}`,
          serverId: serverFarm.id,
          user_id: serverFarm.user_id,
          name: serverFarm.name,
          location: serverFarm.location,
          syncStatus: 'synced' as any,
          updatedAt: serverFarm.updated_at,
        });
      }
    }

    if (toRemove.length > 0) {
      await db.farms.bulkRemove(toRemove.map(d => d.id));
    }
    if (toUpsert.length > 0) {
      await db.farms.bulkUpsert(toUpsert);
    }
  }

  /** Upsert fields from the server into local RxDB. */
  private async upsertFields(db: SwardDatabase, serverFields: any[]): Promise<void> {
    if (!serverFields || serverFields.length === 0) return;

    const serverIds = serverFields.map(s => s.id);
    const existingDocsArray = await db.fields.find({
      selector: { serverId: { $in: serverIds } }
    }).exec();

    const existingDocsMap = new Map();
    for (const doc of existingDocsArray) {
      existingDocsMap.set(doc.serverId, doc);
    }

    const localDocIds = existingDocsArray.map(doc => doc.id);
    const outboxEntriesArray = await db.outbox.find({
      selector: { localDocId: { $in: localDocIds }, status: 'pending' }
    }).exec();

    const pendingOutboxMap = new Set();
    for (const entry of outboxEntriesArray) {
      pendingOutboxMap.add(entry.localDocId);
    }

    const toUpsert = [];
    const toRemove = [];

    for (const serverField of serverFields) {
      const localDoc = existingDocsMap.get(serverField.id);

      if (serverField.is_deleted) {
        if (localDoc) toRemove.push(localDoc);
        continue;
      }

      if (localDoc) {
        const hasPending = pendingOutboxMap.has(localDoc.id);
        if (this.shouldOverwriteLocal(localDoc.updatedAt, serverField.updated_at, hasPending)) {
          await localDoc.patch({
            name: serverField.name,
            area_hectares: serverField.area_hectares,
            updatedAt: serverField.updated_at,
            syncStatus: 'synced' as any,
          });
        }
      } else {
        toUpsert.push({
          id: `server-${serverField.id}`,
          serverId: serverField.id,
          farm_id: serverField.farm_id,
          name: serverField.name,
          area_hectares: serverField.area_hectares,
          syncStatus: 'synced' as any,
          updatedAt: serverField.updated_at,
        });
      }
    }

    if (toRemove.length > 0) {
      await db.fields.bulkRemove(toRemove.map(d => d.id));
    }
    if (toUpsert.length > 0) {
      await db.fields.bulkUpsert(toUpsert);
    }
  }

  /** Upsert events from the server into local RxDB. */
  private async upsertEvents(db: SwardDatabase, serverEvents: any[]): Promise<void> {
    if (!serverEvents || serverEvents.length === 0) return;

    const serverIds = serverEvents.map(s => s.id);
    const existingDocsArray = await db.events.find({
      selector: { serverId: { $in: serverIds } }
    }).exec();

    const existingDocsMap = new Map();
    for (const doc of existingDocsArray) {
      existingDocsMap.set(doc.serverId, doc);
    }

    const localDocIds = existingDocsArray.map(doc => doc.id);
    const outboxEntriesArray = await db.outbox.find({
      selector: { localDocId: { $in: localDocIds }, status: 'pending' }
    }).exec();

    const pendingOutboxMap = new Set();
    for (const entry of outboxEntriesArray) {
      pendingOutboxMap.add(entry.localDocId);
    }

    const toUpsert = [];
    const toRemove = [];

    for (const serverEvent of serverEvents) {
      const localDoc = existingDocsMap.get(serverEvent.id);

      if (serverEvent.is_deleted) {
        if (localDoc) toRemove.push(localDoc);
        continue;
      }

      if (localDoc) {
        const hasPending = pendingOutboxMap.has(localDoc.id);
        if (this.shouldOverwriteLocal(localDoc.updatedAt, serverEvent.updated_at, hasPending)) {
          await localDoc.patch({
            event_type: serverEvent.event_type,
            description: serverEvent.description,
            date: serverEvent.date,
            updatedAt: serverEvent.updated_at,
            syncStatus: 'synced' as any,
          });
        }
      } else {
        toUpsert.push({
          id: `server-${serverEvent.id}`,
          serverId: serverEvent.id,
          field_id: serverEvent.field_id,
          event_type: serverEvent.event_type,
          description: serverEvent.description,
          date: serverEvent.date,
          syncStatus: 'synced' as any,
          updatedAt: serverEvent.updated_at,
        });
      }
    }

    if (toRemove.length > 0) {
      await db.events.bulkRemove(toRemove.map(d => d.id));
    }
    if (toUpsert.length > 0) {
      await db.events.bulkUpsert(toUpsert);
    }
  }

  /** Upsert soil analyses from the server into local RxDB. */
  private async upsertSoilAnalyses(db: SwardDatabase, serverAnalyses: any[]): Promise<void> {
    if (!serverAnalyses || serverAnalyses.length === 0) return;

    const serverIds = serverAnalyses.map(s => s.id);
    const existingDocsArray = await db.soil_analyses.find({
      selector: { serverId: { $in: serverIds } }
    }).exec();

    const existingDocsMap = new Map();
    for (const doc of existingDocsArray) {
      existingDocsMap.set(doc.serverId, doc);
    }

    const localDocIds = existingDocsArray.map(doc => doc.id);
    const outboxEntriesArray = await db.outbox.find({
      selector: { localDocId: { $in: localDocIds }, status: 'pending' }
    }).exec();

    const pendingOutboxMap = new Set();
    for (const entry of outboxEntriesArray) {
      pendingOutboxMap.add(entry.localDocId);
    }

    const toUpsert = [];
    const toRemove = [];

    for (const serverAnalysis of serverAnalyses) {
      const localDoc = existingDocsMap.get(serverAnalysis.id);

      if (serverAnalysis.is_deleted) {
        if (localDoc) toRemove.push(localDoc);
        continue;
      }

      if (localDoc) {
        const hasPending = pendingOutboxMap.has(localDoc.id);
        if (this.shouldOverwriteLocal(localDoc.updatedAt, serverAnalysis.updated_at, hasPending)) {
          await localDoc.patch({
            ph_level: serverAnalysis.ph_level,
            phosphorus_index: serverAnalysis.phosphorus_index,
            potassium_index: serverAnalysis.potassium_index,
            magnesium_index: serverAnalysis.magnesium_index,
            updatedAt: serverAnalysis.updated_at,
            syncStatus: 'synced' as any,
          });
        }
      } else {
        toUpsert.push({
          id: `server-${serverAnalysis.id}`,
          serverId: serverAnalysis.id,
          field_id: serverAnalysis.field_id,
          sample_date: serverAnalysis.sample_date,
          ph_level: serverAnalysis.ph_level,
          phosphorus_index: serverAnalysis.phosphorus_index,
          potassium_index: serverAnalysis.potassium_index,
          magnesium_index: serverAnalysis.magnesium_index,
          syncStatus: 'synced' as any,
          updatedAt: serverAnalysis.updated_at,
        });
      }
    }

    if (toRemove.length > 0) {
      await db.soil_analyses.bulkRemove(toRemove.map(d => d.id));
    }
    if (toUpsert.length > 0) {
      await db.soil_analyses.bulkUpsert(toUpsert);
    }
  }

  /** Upsert fertilisation plans from the server into local RxDB. */
  private async upsertFertilisationPlans(db: SwardDatabase, serverPlans: any[]): Promise<void> {
    if (!serverPlans || serverPlans.length === 0) return;

    const serverIds = serverPlans.map(s => s.id);
    const existingDocsArray = await db.fertilisation_plans.find({
      selector: { serverId: { $in: serverIds } }
    }).exec();

    const existingDocsMap = new Map();
    for (const doc of existingDocsArray) {
      existingDocsMap.set(doc.serverId, doc);
    }

    const localDocIds = existingDocsArray.map(doc => doc.id);
    const outboxEntriesArray = await db.outbox.find({
      selector: { localDocId: { $in: localDocIds }, status: 'pending' }
    }).exec();

    const pendingOutboxMap = new Set();
    for (const entry of outboxEntriesArray) {
      pendingOutboxMap.add(entry.localDocId);
    }

    const toUpsert = [];
    const toRemove = [];

    for (const serverPlan of serverPlans) {
      const localDoc = existingDocsMap.get(serverPlan.id);

      if (serverPlan.is_deleted) {
        if (localDoc) toRemove.push(localDoc);
        continue;
      }

      if (localDoc) {
        const hasPending = pendingOutboxMap.has(localDoc.id);
        if (this.shouldOverwriteLocal(localDoc.updatedAt, serverPlan.updated_at, hasPending)) {
          await localDoc.patch({
            crop_type: serverPlan.crop_type,
            target_yield: serverPlan.target_yield,
            nitrogen_requirement: serverPlan.nitrogen_requirement,
            phosphorus_requirement: serverPlan.phosphorus_requirement,
            potassium_requirement: serverPlan.potassium_requirement,
            application_date: serverPlan.application_date,
            updatedAt: serverPlan.updated_at,
            syncStatus: 'synced' as any,
          });
        }
      } else {
        toUpsert.push({
          id: `server-${serverPlan.id}`,
          serverId: serverPlan.id,
          field_id: serverPlan.field_id,
          crop_type: serverPlan.crop_type,
          target_yield: serverPlan.target_yield,
          nitrogen_requirement: serverPlan.nitrogen_requirement,
          phosphorus_requirement: serverPlan.phosphorus_requirement,
          potassium_requirement: serverPlan.potassium_requirement,
          application_date: serverPlan.application_date,
          syncStatus: 'synced' as any,
          updatedAt: serverPlan.updated_at,
        });
      }
    }

    if (toRemove.length > 0) {
      await db.fertilisation_plans.bulkRemove(toRemove.map(d => d.id));
    }
    if (toUpsert.length > 0) {
      await db.fertilisation_plans.bulkUpsert(toUpsert);
    }
  }

  // ──────────────────────────────────────────────────────────
  // LWW Conflict Resolution
  // ──────────────────────────────────────────────────────────

  /**
   * Determine whether the local doc should be overwritten by the server record.
   */
  private shouldOverwriteLocal(
    localUpdatedAt: string,
    serverUpdatedAt: string,
    hasPendingOutbox: boolean,
  ): boolean {
    const serverTime = new Date(serverUpdatedAt).getTime();
    const localTime = new Date(localUpdatedAt).getTime();

    if (serverTime >= localTime) {
      return true; // Server is newer
    }

    if (hasPendingOutbox) {
      return false; // Local has pending changes, keep them
    }

    return true; // Local changes were already pushed, overwrite with server
  }

  // ──────────────────────────────────────────────────────────
  // Local Doc Helpers
  // ──────────────────────────────────────────────────────────

  /** Update a local RxDB document's syncStatus. */
  private async updateLocalDocStatus(
    db: SwardDatabase,
    entityType: string,
    localDocId: string,
    status: 'synced' | 'failed',
  ): Promise<void> {
    const collection = (db as any)[entityType];
    if (!collection) return;
    const doc = await collection.findOne(localDocId).exec();
    if (doc) {
      await doc.patch({ syncStatus: status });
    }
  }

  /** Update a local RxDB document with the server-assigned ID and mark as synced. */
  private async updateLocalDocServerId(
    db: SwardDatabase,
    entityType: string,
    localDocId: string,
    serverId: number,
  ): Promise<void> {
    const collection = (db as any)[entityType];
    if (!collection) return;
    const doc = await collection.findOne(localDocId).exec();
    if (doc) {
      await doc.patch({ serverId, syncStatus: 'synced' as any });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
