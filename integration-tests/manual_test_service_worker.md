# Manual Test Guide: Service Worker Auto-Update (PRD 0015)

Testing the background update functionality provided by the Angular Service Worker (`@angular/service-worker`) can be problematic in standard automated E2E environments because:
- Service workers require a valid production build (`!isDevMode()`) to function.
- They require specific HTTP caching headers to properly download the latest `ngsw.json` file.
- Simulating a deployment rollout in the middle of an E2E test without tearing down the test environment is difficult.

Therefore, you should run this manual test to verify that background auto-updates and auto-reloads are functioning correctly.

## Prerequisites

1. Ensure you have `http-server` installed globally (or use `npx http-server`). This provides a simple static server that doesn't implement active hot-reloading (which would mask the service worker behavior).
   ```bash
   npm install -g http-server
   ```
2. Navigate to the frontend directory:
   ```bash
   cd sw-fe-container
   ```

## Test Execution Steps

### 1. Build and Serve Initial Version

First, create a production build of the Angular application:

```bash
npx -p @angular/cli@18 ng build --configuration production
```

Serve the built application with caching disabled on the server (to simulate the exact Nginx cache-control headers specified in PRD 0015):

```bash
http-server dist/temp-app/browser -p 8081 -c-1
```
*(Leave this terminal window running)*

### 2. Register the Service Worker

1. Open a new Incognito or Private Browsing window (to ensure a clean state).
2. Navigate to `http://127.0.0.1:8081/`.
3. Open the browser's Developer Tools (F12) -> **Application** tab -> **Service Workers**.
4. Verify that the Service Worker (`ngsw-worker.js`) is registered and active.
5. Keep this browser tab open.

### 3. Simulate a New Deployment

Open a second terminal window (leave the `http-server` running in the first).

Modify a visible element in the frontend code. For example, open `sw-fe-container/src/app/home/home.component.html` and change the text "Good to Spread" to "Good to Spread - VERSION 2!".

Rebuild the application for production:

```bash
cd sw-fe-container
npx -p @angular/cli@18 ng build --configuration production
```

*(Note: Ensure you are overwriting the same `dist/temp-app/browser` directory that `http-server` is currently serving).*

### 4. Verify Background Update

1. Return to the browser window. **Do not refresh the page.**
2. Wait a few moments. The `VersionUpdateService` is configured to check for updates periodically and when the window gains focus.
3. If it doesn't happen immediately, click away to another application and then click back into the browser tab (to trigger the `window.focus` event in the service).
4. **Expected Result**:
   - The Service Worker will detect the modified `ngsw.json` file.
   - It will download the new application assets in the background.
   - Upon completion, it will dispatch a `VERSION_READY` event.
   - The `VersionUpdateService` will catch this event, activate the update, and automatically trigger a `window.location.reload()`.
   - The page will instantly refresh and you will see "Good to Spread - VERSION 2!" without having to clear your cache or perform a hard reload.

## Cleanup

1. Close the browser window.
2. Stop the `http-server` process (Ctrl+C).
3. Revert your temporary change in `home.component.html`.
