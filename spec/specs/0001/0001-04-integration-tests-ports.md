# 0001-04 Integration Tests Ports Specification

**State**: Complete

## Scope
This specification covers the integration test requirements for testing backend endpoints. It ensures that exposed service endpoints and internal container ports are verified correctly, with the lifecycle port remaining unexposed.

## Service Endpoint Verification
- The backend application is exposed via a Kubernetes Service on port 80.
- Integration tests must verify the main application HTTP endpoint (e.g. `/v0/hello`) through the Service domain (`http://sward-warden-be`) on port 80.

## Direct Pod Verification
- Integration tests must extract the backend Pod IP from the cluster dynamically.
- Integration tests must verify the backend application HTTP endpoint directly on the Pod IP on port 8080.
- Integration tests must verify the backend lifecycle/health endpoint (`/hams/alive`) directly on the Pod IP on port 8079.
