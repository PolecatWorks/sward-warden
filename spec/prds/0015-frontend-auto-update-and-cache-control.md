# PRD 0015: Frontend Auto-Update and Background Cache Sync

## Overview
When a new version of the frontend application is deployed, existing open browser sessions should automatically detect the new deployment and update in the background. Users must not be required to manually perform a hard browser refresh (Ctrl+F5) or clear browser caches to get the latest application version.

## Requirements

### 1. Nginx Cache-Control Strategy
* **Index HTML & Service Worker Files**: The web server must explicitly serve `index.html`, `ngsw.json`, `ngsw-worker.js`, and any web worker files with strict non-caching HTTP response headers (`Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`).
* **Hashed Bundles & Static Assets**: Hashed JavaScript, CSS, images, and font files must be served with immutable long-term caching headers (`Cache-Control: public, max-age=31536000, immutable`).

### 2. Angular Service Worker Integration (`@angular/service-worker`)
* Enable the Angular Service Worker in production build configurations (`sw-fe-container`).
* Configure `ngsw-config.json` to prefetch app shell assets and static bundles in the background upon a new version detection.

### 3. Background Update Detection & Auto-Reload Service
* Implement a dedicated frontend service (`VersionUpdateService`) that periodically checks for new updates (e.g. every 15 minutes and on window focus).
* When a new version is downloaded and ready in the background, automatically apply the update cleanly (e.g. upon next navigation, idle state, or seamless reload) to ensure users are always running the latest application build.

### 4. Testing Requirements
* Due to the complexities of testing Service Worker lifecycle events (registration, update detection, and activation) in standard automated E2E environments (which typically run in dev mode or mock network conditions), full automated coverage for auto-updates is difficult and flaky.
* A manual testing procedure must be maintained and executed to verify the end-to-end background update workflow. See `integration-tests/manual_test_service_worker.md` for the correct procedure.
