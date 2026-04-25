import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, distinctUntilChanged } from 'rxjs';
import { NetworkService } from './network.service';

/** The possible sync states of the application. */
export type SyncState = 'offline' | 'syncing' | 'synced';

/**
 * Service that tracks the current synchronisation state of the application.
 *
 * State transitions:
 *  - When offline → `offline`
 *  - When sync operations are in progress → `syncing`
 *  - When all sync operations are complete → `synced`
 *
 * The sync engine (0011-04/0011-05) will call `setSyncing()` and `setSynced()`
 * to drive transitions. The network service drives the offline state automatically.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncStateService {
  /** Internal subject tracking whether a sync operation is active. */
  private readonly syncActive$ = new BehaviorSubject<boolean>(false);

  /** The current sync state, derived from network status and sync activity. */
  readonly syncState$: Observable<SyncState>;

  constructor(private networkService: NetworkService) {
    this.syncState$ = combineLatest([
      this.networkService.isOnline$,
      this.syncActive$,
    ]).pipe(
      map(([isOnline, isSyncing]): SyncState => {
        if (!isOnline) return 'offline';
        if (isSyncing) return 'syncing';
        return 'synced';
      }),
      distinctUntilChanged(),
    );
  }

  /** Called by the sync engine when sync operations begin. */
  setSyncing(): void {
    this.syncActive$.next(true);
  }

  /** Called by the sync engine when sync operations complete. */
  setSynced(): void {
    this.syncActive$.next(false);
  }
}
