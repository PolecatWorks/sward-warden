import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

import { APP_CONFIG, AppConfig } from './app-config';
import { devAuthInterceptor } from './services/dev-auth.interceptor';

export const createAppConfig = (config: AppConfig): ApplicationConfig => ({
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([devAuthInterceptor])),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    { provide: APP_CONFIG, useValue: config }
  ]
});
