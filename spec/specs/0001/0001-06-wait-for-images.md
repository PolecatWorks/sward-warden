# 0001-06 Wait for Images Specification

**State**: Complete

## Scope
This specification defines the behavior for ensuring that the backend and frontend Docker images are fully built and pushed to the container registry before the integration tests attempt to deploy or run. This prevents Kubernetes pods from failing to pull non-existent images and entering long image pull backoffs.

## Wait for Images Verification
- Before running Garden commands to deploy or run integration tests, the CI integration workflow must verify that the target Docker images (frontend and backend) exist in the container registry.
- If the images do not exist yet, the workflow must block and poll the registry until they are available.
- If the wait times out (e.g. after a defined timeout like 10 minutes), the workflow should exit with a failure.
- This validation must be performed in the GitHub Actions integration test workflow (`.github/workflows/integration-test.yaml`) right before the Garden test command is executed.
