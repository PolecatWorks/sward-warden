import { Injectable } from '@angular/core';
import { Observable, merge, fromEvent, map, startWith, shareReplay } from 'rxjs';

/**
 * Service that exposes the browser's network connectivity state as a
 * reactive observable. Consumers subscribe to `isOnline$` to react to
 * connectivity changes.
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  /** Emits `true` when online, `false` when offline. Shared across all subscribers. */
  readonly isOnline$: Observable<boolean>;

  constructor() {
    this.isOnline$ = merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      startWith(navigator.onLine),
      shareReplay(1),
    );
  }
}
