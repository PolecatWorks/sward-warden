# 0015-01: Frontend Auto-Update and Background Cache Sync Specification

- **Status**: Complete
- **PRD Reference**: [PRD 0015](../../prds/0015-frontend-auto-update-and-cache-control.md)

## Objective
Implement background automatic update detection and strict Nginx Cache-Control headers for `sw-fe-container` so that users receive fresh UI updates without performing hard browser refreshes.

## Components & Technical Requirements

### 1. Nginx Configuration (`sw-fe-container/nginx.conf`)
* Set non-caching HTTP headers (`Cache-Control: no-cache, no-store, must-revalidate`) for:
  - `/index.html`
  - `/ngsw.json`
  - `/ngsw-worker.js`
  - `/safety-worker.js`
  - `/manifest.webmanifest`
* Set immutable long-term caching headers (`Cache-Control: public, max-age=31536000, immutable`) for static bundled assets (`.js`, `.css`, `.png`, `.jpg`, `.svg`, `.woff2`).

### 2. Angular Service Worker Setup (`sw-fe-container`)
* Ensure `@angular/service-worker` package dependency is included.
* Create `src/ngsw-config.json` defining app shell assets and caching strategies.
* Configure `angular.json` to enable `serviceWorker: true` in production builds.

### 3. Background Version Update Service (`sw-fe-container`)
* Implement `VersionUpdateService` injected into `AppComponent` (or app root).
* Periodically check for updates (`SwUpdate.checkForUpdate()`) every 15 minutes and on window focus.
* Subscribe to `SwUpdate.versionUpdates` (`VERSION_READY`) to trigger update activation (`SwUpdate.activateUpdate()`) and refresh the application smoothly when new assets are ready.

## Verification
* Run unit/integration tests for frontend build.
* Run `make sw-fe-docker` to build the frontend container and verify Nginx configuration.
