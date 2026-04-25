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
      await this.upsertEntities(db, 'farms', response.farms || [], (serverFarm: any) => ({
        id: `server-${serverFarm.id}`,
        serverId: serverFarm.id,
        user_id: serverFarm.user_id,
        name: serverFarm.name,
        location: serverFarm.location,
        syncStatus: 'synced',
        updatedAt: serverFarm.updated_at,
      }));

      await this.upsertEntities(db, 'fields', response.fields || [], (serverField: any) => ({
        id: `server-${serverField.id}`,
        serverId: serverField.id,
        farm_id: serverField.farm_id,
        name: serverField.name,
        area_hectares: serverField.area_hectares,
        syncStatus: 'synced',
        updatedAt: serverField.updated_at,
      }));

      await this.upsertEntities(db, 'events', response.events || [], (serverEvent: any) => ({
        id: `server-${serverEvent.id}`,
        serverId: serverEvent.id,
        field_id: serverEvent.field_id,
        event_type: serverEvent.event_type,
        description: serverEvent.description,
        date: serverEvent.date,
        syncStatus: 'synced',
        updatedAt: serverEvent.updated_at,
      }));

      await this.upsertEntities(db, 'soil_analyses', response.soil_analyses || [], (serverAnalysis: any) => ({
        id: `server-${serverAnalysis.id}`,
        serverId: serverAnalysis.id,
        field_id: serverAnalysis.field_id,
        sample_date: serverAnalysis.sample_date,
        ph_level: serverAnalysis.ph_level,
        phosphorus_index: serverAnalysis.phosphorus_index,
        potassium_index: serverAnalysis.potassium_index,
        magnesium_index: serverAnalysis.magnesium_index,
        syncStatus: 'synced',
        updatedAt: serverAnalysis.updated_at,
      }));

      await this.upsertEntities(db, 'fertilisation_plans', response.fertilisation_plans || [], (serverPlan: any) => ({
        id: `server-${serverPlan.id}`,
        serverId: serverPlan.id,
        field_id: serverPlan.field_id,
        crop_type: serverPlan.crop_type,
        target_yield: serverPlan.target_yield,
        nitrogen_requirement: serverPlan.nitrogen_requirement,
        phosphorus_requirement: serverPlan.phosphorus_requirement,
        potassium_requirement: serverPlan.potassium_requirement,
        application_date: serverPlan.application_date,
        syncStatus: 'synced',
        updatedAt: serverPlan.updated_at,
      }));

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
  // Upsert Logic with LWW Conflict Resolution
  // ──────────────────────────────────────────────────────────

  /**
   * Generic upsert logic for syncing entities from the server to local RxDB.
   * @param db Local database instance.
   * @param collectionName Name of the collection on the db (e.g., 'farms', 'fields').
   * @param serverEntities Array of entities returned by the server.
   * @param mapFn Function mapping a server entity to a local document format.
   */
  private async upsertEntities(
    db: SwardDatabase,
    collectionName: keyof import('./rxdb/rxdb.service').SwardCollections,
    serverEntities: any[],
    mapFn: (serverEntity: any) => any
  ): Promise<void> {
    const collection = db[collectionName] as any;
    for (const serverEntity of serverEntities) {
      if (serverEntity.is_deleted) {
        const docs = await collection.find({ selector: { serverId: serverEntity.id } }).exec();
        for (const doc of docs) { await doc.remove(); }
        continue;
      }
      const existing = await collection.find({ selector: { serverId: serverEntity.id } }).exec();
      const mappedData = mapFn(serverEntity);
      if (existing.length > 0) {
        const localDoc = existing[0];
        if (await this.shouldOverwriteLocal(db, localDoc.updatedAt, serverEntity.updated_at, localDoc.id)) {
          // Remove fields that should not be updated (e.g., id, serverId)
          const { id, serverId, ...patchData } = mappedData;
          await localDoc.patch(patchData);
        }
      } else {
        await collection.upsert(mappedData);
      }
    }
  }



  // ──────────────────────────────────────────────────────────
  // LWW Conflict Resolution
  // ──────────────────────────────────────────────────────────

  /**
   * Determine whether the local doc should be overwritten by the server record.
   *
   * Last Write Wins (LWW) strategy:
   *  - If server is newer → overwrite
   *  - If local is newer with pending outbox entry → keep local (will be pushed next sync)
   *  - If local is newer without pending outbox entry → overwrite (local changes already pushed)
   */
  private async shouldOverwriteLocal(
    db: SwardDatabase,
    localUpdatedAt: string,
    serverUpdatedAt: string,
    localDocId: string,
  ): Promise<boolean> {
    const serverTime = new Date(serverUpdatedAt).getTime();
    const localTime = new Date(localUpdatedAt).getTime();

    if (serverTime >= localTime) {
      return true; // Server is newer
    }

    // Local is newer — check for pending outbox entry
    const pendingOutbox = await db.outbox.find({
      selector: { localDocId, status: 'pending' },
    }).exec();

    if (pendingOutbox.length > 0) {
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
      await doc.patch({ serverId, syncStatus: 'synced' });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
