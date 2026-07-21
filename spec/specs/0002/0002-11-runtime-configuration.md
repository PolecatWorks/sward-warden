# 0002-11: Runtime Configuration

**State**: Complete

## Scope
This specification covers the implementation of dynamic runtime configuration loading for the Angular fe application.

## Configuration File
- **Path**: `sw-fe-container/src/assets/contents/app-config.json`
- **Format**: JSON
- **Runtime Path**: `/assets/contents/app-config.json`

## Data Structures

### Interfaces
```typescript
export interface OTelConfig {
  collectorUrl: string;
  logLevel: string;
}

export interface OidcConfig {
  issuer: string;
  clientId: string;
  scope: string;
  requireHttps?: boolean;
}

export interface AppConfig {
  apiPath: string;
  otel?: OTelConfig;
  logLevel: string;
  auth?: OidcConfig;
}
```

### Injection Token
- An `InjectionToken<AppConfig>` named `APP_CONFIG` must be provided for application-wide access to the configuration.

## Implementation Details

### 1. Pre-bootstrapping Load
- The `main.ts` file must use the `fetch` API to retrieve `/assets/contents/app-config.json`.
- The loading process should occur before the Angular `bootstrapApplication` call.
- Error handling should be implemented to log configuration load failures to the console and potentially fall back to default values.

### 2. Application Bootstrapping
- The `bootstrap` function (typically in `bootstrap.ts`) should accept the `AppConfig` object as a parameter.
- The `ApplicationConfig` must provide the `APP_CONFIG` token with the passed value.

### 3. API Service Integration
- Base API services and interceptors must inject `APP_CONFIG`.
- All be requests should be prefixed with the `apiPath` provided in the configuration.

### 4. Telemetry and Logging
- The `otel` configuration should be used to initialize OpenTelemetry providers if present.
- The `logLevel` should be used to configure the application's logging service.

### 5. Deployment Override
- The Docker image will contain a default `app-config.json` in the `assets/contents` directory.
- In Kubernetes, a `ConfigMap` can be mounted as a volume at `/usr/share/nginx/html/assets/contents/app-config.json` to provide environment-specific settings (e.g., setting `apiPath` to `/swarm`).

## Acceptance Criteria
- [ ] Application fetches `app-config.json` on startup.
- [ ] Config is available via `APP_CONFIG` injection token.
- [ ] API requests use the `apiPath` from the configuration.
- [ ] OTel and LogLevel are correctly applied from the configuration.
- [ ] Application fails gracefully or logs error if config is missing or invalid.
