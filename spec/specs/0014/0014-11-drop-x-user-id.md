# 0014-11 Drop X-User-ID Header Support

## Description
This specification resolves the contradiction identified in PRDs regarding the use of the `X-User-ID` header versus the `Authorization: Bearer <token>` JWT flow. As dictated by PRD 0014, the application must fully migrate to using JWTs for authentication and drop legacy support for `X-User-ID` headers in frontend API calls.

## Requirements
1. **Frontend Services Modification:** The `FarmManagementService` and `ChatService` (and any other frontend API services) must no longer inject the `X-User-ID` header into their outgoing requests.
2. **Frontend Tests Update:** The mock configurations within frontend tests, such as `sync-engine.service.spec.ts`, must be updated to remove any expectations or provisions of the `X-User-ID` header.
3. **Integration Tests Alignment:** The end-to-end integration tests (like those in `AuthRequests.py`) currently simulate the legacy flow by intercepting `X-User-ID` headers to fetch JWTs. Since the tests rely on this header to signify which user is logging in before token fetching, we will update the tests to use proper Authorization headers, or keep the test helper to gracefully translate `X-User-ID` logic solely for testing convenience without affecting the application code. In this update, the main goal is modifying the application logic.

## Changes
- `sw-fe-container/src/app/services/farm-management.service.ts`: Remove `'X-User-ID': userId` from `getHeaders()`.
- `sw-fe-container/src/app/services/chat.service.ts`: Remove `'X-User-ID': userId` from `getHeaders()`.
- `sw-fe-container/src/app/services/sync-engine.service.spec.ts`: Remove `X-User-ID` header mock in the test setup.
- `spec/prds/readme.md`: Mark the contradiction as resolved.
