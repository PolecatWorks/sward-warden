# 0001-05 Skip Integration Tests Specification

**State**: Open

## Scope
This specification defines the behavior and implementation details for optimizing the CI integration test workflow (`.github/workflows/integration-test.yaml`). The goal is to skip executing integration tests on Kubernetes when a pull request does not contain any code or deployment changes, reducing resource utilization and test execution times while ensuring required status checks always pass.

## Path Filtering Conditions
The integration tests must only run if a pull request contains modifications to one or more of the following paths:
- `sw-be-container/**` (Backend source and configuration)
- `sw-fe-container/**` (Frontend source and configuration)
- `charts/**` (Helm charts and deployment configurations)
- `integration-tests/**` (Integration tests, Robot files, and test runner)
- `.github/workflows/integration-test.yaml` (The integration test workflow file itself)
- `.github/workflows/sw-be-docker-publish.yml` (Backend Docker workflow)
- `.github/workflows/sw-fe-docker-publish.yml` (Frontend Docker workflow)
- `.github/workflows/helm-ci-pr.yaml` (Helm pull request CI workflow)
- `.github/workflows/helm-ci-main.yaml` (Helm main CI workflow)

If none of the above files are changed, the integration tests must be skipped.

## Status Check Coordination (GitHub Actions)
- The GitHub repository enforces `integration` as a required status check for pull requests.
- To ensure this required check always passes even when skipped, the workflow must use a coordinating final status check job named `integration` (running on `ubuntu-latest` with `if: always()`).
- The actual integration testing steps must be moved to a separate job (e.g. `run-tests`) that executes on `polecatworks-runner` only when the path-filtering indicates changes.
- The `integration` job must:
  - Depend on (`needs`) both `check-paths` and `run-tests`.
  - Check if the test job was executed (if changes were found).
  - If tests were executed, propagate the success or failure of `run-tests`.
  - If tests were skipped, immediately exit with success (exit code 0), providing an automatic completion for the status check.
