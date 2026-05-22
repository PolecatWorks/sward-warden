---
name: branch-helper
description: Pulls down a remote branch, rebases it with main, runs and fixes frontend and backend unit tests, verifies and fixes Docker builds, pushes to trigger CI, runs integration tests with Garden, iterates on integration tests, and pushes final fixes.
---

# Branch Helper & Test Verification Skill

Use this skill to automate the process of fetching a branch, rebasing with main, resolving conflicts, running/fixing frontend and backend unit tests, verifying Docker builds, running Garden integration tests, and pushing the final verified code.

## 1. Setup & Branch Checkout

1. Fetch all latest branches from origin:
   ```bash
   git fetch origin
   ```
2. Checkout and pull down the target branch:
   ```bash
   git checkout <branch-name>
   git pull origin <branch-name>
   ```

## 2. Rebase with Main

1. Rebase the branch onto the latest `origin/main`:
   ```bash
   git rebase origin/main
   ```
2. If conflicts arise, resolve them. Pay special attention to:
   - Dependency files (e.g., `package.json`, `package-lock.json`, `Cargo.toml`).
   - Configuration files (e.g., `garden.yml`).

## 3. Run and Fix Frontend & Backend Unit Tests

### Frontend (Angular)
1. Navigate to the frontend directory:
   ```bash
   cd sw-fe-container
   ```
2. Execute tests in headless mode:
   ```bash
   npm run test -- --watch=false --browsers=ChromeHeadless
   ```
3. **If tests fail due to Angular Injector or Dexie DB Lock Errors (RxDB COL23)**:
   - Check if the failing component injects services that open real database/network connections (e.g., `FarmManagementService`, `WeatherService`, `SpatialService`).
   - Mock these services at the `TestBed` level in the spec file (e.g., using `jasmine.createSpyObj` or providing custom mock implementations).
   - Verify `LoggerService` configuration in tests (ensure level matches the test expectations, e.g., `'DEBUG'`).

### Backend (Rust)
1. Navigate to the backend directory:
   ```bash
   cd sw-be-container
   ```
2. Execute unit tests:
   ```bash
   cargo test
   ```
3. Fix any compilation or logic failures.

## 4. Run and Fix Docker Builds

### Frontend Docker Build
1. Build the image locally to check for dependency compilation issues:
   ```bash
   docker build -t test-fe sw-fe-container
   ```
2. **If `npm ci` fails due to peer dependency mismatches**:
   - Check version mismatches between packages (e.g., `@angular-devkit/build-angular` vs Angular core version). Downgrade or upgrade versions in `package.json` to match the target environment.
3. **If `npm ci` fails due to lockfile version/platform discrepancies under node:22-alpine**:
   - Run npm install inside the target container context to regenerate `package-lock.json` cleanly, then replace it on the host.

### Backend Docker Build
1. Build the backend image locally:
   ```bash
   docker build -t test-be sw-be-container
   ```
2. Ensure that unit tests run successfully during docker build if they are part of the multi-stage Dockerfile.

## 5. Push to Trigger CI

1. Run `git status` to see modified files.
2. If pre-commit hooks fail due to line changes of secrets in `garden.yml`, update `.secrets.baseline`:
   ```bash
   git add .secrets.baseline
   ```
3. Commit and push the changes:
   ```bash
   git add -A
   git commit -m "chore: rebase with main and fix unit tests/docker builds"
   git push origin <branch-name> --force-with-lease
   ```

## 6. Run and Iterate on Integration Tests

1. Ensure the namespace is clean before deploying (to avoid stuck StatefulSets or services):
   ```bash
   kubectl delete namespace sward-warden-pr-<pr-number> --ignore-not-found
   ```
2. Run the integration tests with Garden. Garden uses `waitForUnhealthyResources: true` and `timeout: 900` to allow the background CI builds to compile and push the images:
   ```bash
   garden test --env pr
   ```
3. **If integration tests fail**:
   - Pull test reports/logs back from the runner:
     ```bash
     kubectl cp sward-warden-pr-<pr-number>/robot-test-runner:/tmp/reports ./reports
     ```
   - Analyze the logs and screenshots in `./reports`.
   - Update the robot framework tests in `integration-tests/tests/`.
   - Remap port 8080 to port 80 for service-level checks, and check lifecycle/health ports directly on the Pod IP.
   - Re-run `garden test` until all tests pass.

## 7. Final Push
1. Add, commit, and push any integration test fixes to the remote branch to finalize the pull request.
