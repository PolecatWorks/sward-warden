import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription, firstValueFrom, filter, switchMap, from, EMPTY, of, concat, catchError, tap, map } from 'rxjs';
import { RxdbService, SwardDatabase } from './rxdb/rxdb.service';
import { NetworkService } from './network.service';
import { SyncStateService } from './sync-state.service';
import { FarmManagementService } from './farm-management.service';
import { OutboxDocType } from './rxdb/schemas';

/** Maximum retry attempts before marking an outbox entry as permanently failed. */
const MAX_RETRIES = 3;

/**
 * Service responsible for processing the outbox queue.
 *
 * When the network comes online, the engine iterates through pending
 * outbox entries in chronological order and executes the corresponding
 * HTTP requests against the backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncEngineService implements OnDestroy {
  private subscription: Subscription;

  constructor(
    private rxdbService: RxdbService,
    private networkService: NetworkService,
    private syncStateService: SyncStateService,
    private farmService: FarmManagementService,
    private http: HttpClient,
  ) {
    // When we come online, process the outbox queue
    this.subscription = this.networkService.isOnline$.pipe(
      filter(online => online),
      switchMap(() => from(this.processOutbox())),
    ).subscribe();
  }

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
        // Success: remove the outbox entry
        await entry.remove();
      } catch (error) {
        // Failure: increment retry count
        const newRetryCount = (entry.retryCount || 0) + 1;
        if (newRetryCount >= MAX_RETRIES) {
          await entry.patch({ status: 'failed', retryCount: newRetryCount });
          // Update the local document's syncStatus to failed
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
        // Update local doc with server-assigned ID and mark as synced
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
