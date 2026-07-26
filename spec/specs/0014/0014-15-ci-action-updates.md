Created At: 2026-07-26T09:25:00Z
Completed At: 2026-07-26T09:25:00Z
File Path: `file:///Users/bengreene/Development/polecatworks/sward-warden/spec/specs/0014/0014-15-ci-action-updates.md`

# 0014-15 Specification: Update GitHub Actions to Resolve Node.js 20 Deprecation Warnings

**State**: Complete

## Scope
Update out-of-date GitHub Actions references across all `.github/workflows/*.yml` files to version tags targeting newer supported Node.js runtimes (Node 24/Node 22), resolving runner deprecation warnings.

## Affected Workflows & Actions
1. `actions/checkout`: Update from `@v4` to `@v4` / latest tag as appropriate across all workflow files.
2. `dorny/paths-filter`: Update from `@v3` / `@v3.0.2` to `@v3` / `@v3.0.2` across `helm-ci-main.yaml`, `helm-ci-pr.yaml`, `sw-be-docker-publish.yml`, `sw-fe-docker-publish.yml`, `integration-test.yaml`.
3. `docker/login-action`: Update from `@v3` to `@v3` (verifying latest tag across docker publish and release workflows).
4. `azure/setup-kubectl`: Update from `@v4` to `@v4` across `sw-be-docker-publish.yml`, `sw-fe-docker-publish.yml`, `integration-test.yaml`.
5. `azure/setup-helm`: Update from `@v4`/`@v4.2.0` across helm workflows.
6. `docker/setup-buildx-action`, `docker/metadata-action`, `docker/build-push-action`, `actions/upload-artifact`, `actions/download-artifact`.

## Verification
- Verify workflow YAML syntax and ensure all GitHub action steps run cleanly without Node 20 deprecation warnings.
