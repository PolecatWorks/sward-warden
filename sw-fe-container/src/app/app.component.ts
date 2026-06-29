import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SyncEngineService } from './services/sync-engine.service';
import { SwUpdate } from '@angular/service-worker';
import { APP_CONFIG, AppConfig } from './app-config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'temp-app';
  private syncIntervalId: any;

  constructor(
    private syncEngine: SyncEngineService,
    private swUpdate: SwUpdate,
    @Inject(APP_CONFIG) private config: AppConfig
  ) {}

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((evt) => {
        if (evt.type === 'VERSION_READY') {
          if (confirm('A new version of the app is available. Reload?')) {
            window.location.reload();
          }
        }
      });
    }

    const intervalMs = this.config.serviceWorker?.syncIntervalMs || 300000; // Default 5 minutes

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        // Register periodic background sync if supported
        if ('periodicSync' in registration) {
          try {
            const status = await navigator.permissions.query({
              name: 'periodic-background-sync' as any
            });

            if (status.state === 'granted') {
              await (registration as any).periodicSync.register('sward-periodic-sync', {
                minInterval: intervalMs
              });
              console.log('Periodic background sync registered with interval:', intervalMs);
            } else {
              console.warn('Periodic background sync permission not granted.');
            }
          } catch (error) {
            console.error('Could not register periodic background sync', error);
          }
        } else {
          // Fallback to foreground setInterval if periodic sync is unsupported
          this.syncIntervalId = setInterval(async () => {
             console.log('Running periodic background sync (fallback)');
             try {
                 await this.syncEngine.fullSync();
             } catch (error) {
                 console.error('Periodic sync fallback failed', error);
             }
          }, intervalMs);
        }

      });

      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'SYNC_REQUESTED') {
          console.log('Background sync requested by service worker');
          await this.syncEngine.fullSync();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
  }
}
