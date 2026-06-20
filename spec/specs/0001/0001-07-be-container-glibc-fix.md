# 0001-07 Backend Container GLIBC and Runtime Verification Specification

**State**: Complete

## Scope
This specification defines the fix for resolving the GLIBC version mismatch between the builder environment and the runtime environment for the backend container. It also specifies a validation step during the container build process to guarantee the compiled binary is compatible with the runtime environment.

## Base Image Alignment
- The builder environment (`chef`) must use a Debian version that matches the runtime base image (`debian:bookworm-slim`).
- The cargo-chef base image must be pinned to the Bookworm release tag: `lukemathwalker/cargo-chef:latest-rust-1-bookworm`.

## Runtime Verification
- A verification step must be added to the Dockerfile in the runtime stage to verify that the compiled binary is compatible and executable on the target runtime.
- This verification must run the application's CLI version command: `/usr/local/bin/sw-be-container version`.
- If the binary is incompatible (e.g., due to a GLIBC mismatch), the Docker build must fail immediately.
