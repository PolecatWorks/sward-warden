# 0001-03 Deployment Specification

**State**: Complete

## Scope
This specification details the deployment and infrastructure mechanisms as per PRD 0001.

## Containerization
- Both the fe (`sw-fe-container/`) and be (`sw-be-container/`) must be containerized.
- Dockerfiles to be created for both services to produce deployable Docker images.

## Kubernetes Integration
- **Target Platform**: Kubernetes cluster.
- **Service Mesh**: Istio will be used to manage cross-cutting concerns such as security, authentication, and authorization.
- **Helm Charts**: All deployment configuration and resource definitions will be managed using Helm.
- **Location**: Helm charts will reside in the `charts/` directory.

## Be Deployment specifics
- The be Kubernetes Deployment should be configured to handle lifecycle events via HTTP on port 8079 (liveness, readiness probes).
- The primary service will expose the be application traffic on port 8080.
- Migration processes should be structured using Init Containers or Helm Hooks via the application's CLI `migrate` subcommand.

## Expected Workflows
- Docker image builds and Helm package/deployment actions should be captured in `Makefile` targets.
