import { InjectionToken } from '@angular/core';

export interface OTelConfig {
  collectorUrl: string;
  logLevel: string;
}

export interface ServiceWorkerConfig {
  registrationStrategy?: string;
  syncIntervalMs?: number;
}

export interface AppConfig {
  apiPath: string;
  otel?: OTelConfig;
  logLevel: string;
  serviceWorker?: ServiceWorkerConfig;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
