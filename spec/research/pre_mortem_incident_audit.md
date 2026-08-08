# Pre-Mortem Incident Analysis and Production Safety Audit

## 🚨 Pre-Mortem Incident Report

### 1. Failure Scenario Summary
> **Incident Premise:** The `sward-warden` platform experienced a simultaneous authentication bypass allowing total unauthorized tenant data access, coupled with silent offline database sync corruption, permanent outbox processing deadlocks, and stale state serving across tenants.
> **Severity:** **P0 Critical** | **Trigger:** Unauthenticated external HTTP requests, offline-to-online database sync bursts, and multi-tenant administrative edits.

---

### 2. Failure Root Causes & Code Highlights

#### Scenario A: Unauthenticated JWT Signature Verification Bypass & Header Spoofing (P0 Critical)
- **The Trigger:** External HTTP requests containing forged `x-jwt-payload` headers or unverified `Authorization: Bearer <jwt>` tokens sent to the backend.
- **Vulnerable Code Path:** [`sw-be-container/src/webserver/auth.rs:L216-L283`](file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/auth.rs#L216-L283)
- **Failure Mechanism:**
  1. In `extract_jwt_claims()`, if the request contains an `x-jwt-payload` header, the backend decodes the base64 JSON payload directly and extracts the subject (`sub`) and role without performing **any cryptographic signature verification**.
  2. In production mode (`!enable_dev_auth`), when a standard Bearer token is provided, line 255 splits the token string by `.` and decodes `parts[1]` (the claims payload) as JSON **without validating the cryptographic signature** against Keycloak's public keys.
  3. Attackers can forge arbitrary `sub` (user IDs) and `sward_roles` (`["admin"]`), gaining full unauthorized read/write access to all database records across all tenants.

#### Scenario B: Invalid SQL JOIN Foreign Key Bug & Delta Sync Timestamp Race (P0 Critical)
- **The Trigger:** Non-admin clients triggering standard offline database delta sync requests, or concurrent record edits occurring during sync response serialization.
- **Vulnerable Code Path:** [`sw-be-container/src/webserver/sync.rs:L153`](file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/sync.rs#L153) and [`sync.rs:L229`](file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/sync.rs#L229)
- **Failure Mechanism:**
  1. In `delta_sync()`, line 153 executes: `... JOIN fields f ON fp.field_id = f.id JOIN farms fa ON fp.field_id = fa.id WHERE fa.user_id = $1`. The query erroneously attempts to join `fp.field_id` (a field UUID) directly to `fa.id` (a farm ID). Because field UUIDs never match farm IDs, non-admin users **never receive any fertilization plans**, causing silent data loss on client mobile devices.
  2. `let checkpoint = Utc::now();` is captured at line 229 *after* querying farms, fields, and events. Any entity modified in the database while `delta_sync` is executing (between lines 50 and 229) will have an `updated_at` timestamp earlier than `checkpoint`, but won't be included in the active payload. On the subsequent sync, the client submits `since = checkpoint`, causing those updated records to be **permanently skipped**.

#### Scenario C: Client Outbox Queue Poison Pill Deadlock & ID Type Mismatches (P1 High)
- **The Trigger:** Client network reconnection attempts when an outbox entry fails due to an expired session (401/403) or local ID format mismatch.
- **Vulnerable Code Path:** [`sw-fe-container/src/app/services/sync-engine.service.ts:L251-L275`](file:///Users/bengreene/Development/polecatworks/sward-warden/sw-fe-container/src/app/services/sync-engine.service.ts#L251-L275) and [`sw-fe-container/src/app/utils/local-id.ts:L3-L6`](file:///Users/bengreene/Development/polecatworks/sward-warden/sw-fe-container/src/app/utils/local-id.ts#L3-L6)
- **Failure Mechanism:**
  1. When `processOutbox()` encounters a 401/403 status code from `processEntry()`, it re-throws the error at line 252 without updating `retryCount` or updating `timestamp` on the failing outbox record. Every subsequent outbox processing attempt immediately re-executes the exact same failing head entry, locking up the offline queue indefinitely.
  2. `generateLocalId()` produces string IDs such as `"-172313298812001"`, whereas backend endpoints (e.g. `farms.rs`) parse IDs strictly as `i64` integers, resulting in permanent `400 Bad Request` outbox failures.

#### Scenario D: Admin Cross-Tenant Stale Cache Invalidation Leak (P1 High)
- **The Trigger:** An administrative user creates, updates, or deletes a farm belonging to another user ID.
- **Vulnerable Code Path:** [`sw-be-container/src/webserver/farms.rs:L201`](file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/farms.rs#L201)
- **Failure Mechanism:**
  1. When an admin executes `update_farm` for target tenant `user_id = 42`, line 201 calls `state.farms_cache.write().await.remove(&user_id);` using the *admin's* user ID rather than `target_user_id`.
  2. User 42's cached farm list is never invalidated, causing user 42 to serve stale farm data from the backend's in-memory cache until container restart.

---

### 3. Blast Radius Analysis

- **System Impact:** Total authentication & authorization bypass across all tenant boundaries; silent data omission during client synchronization; complete halt of client offline outbox synchronization; stale cache serving across multi-tenant administrative workflows.
- **Observability Gap:** **High**. The invalid SQL JOIN silently returns empty arrays without raising database errors. Un-verified JWTs return HTTP 200 OK without triggering security alerts. Outbox retries fail silently in client background loops.

---

### 4. Preventive Mitigations (Solutions)

#### Mitigation A: Harden JWT Signature Verification in `auth.rs`

```rust
// BEFORE (Vulnerable - No signature verification for x-jwt-payload or Bearer tokens)
// file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/auth.rs#L216-L283

// AFTER (Hardened - Cryptographically verify tokens against Keycloak JWKS or dev keypair)
async fn extract_jwt_claims(
    parts: &mut Parts,
    state: &AppState,
) -> Result<(String, Option<String>), AppError> {
    let auth_header = parts
        .headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".to_string()))?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("Invalid Authorization header format".to_string()));
    }

    let token = &auth_header["Bearer ".len()..];

    if state.config.debugging.enable_dev_auth {
        let public_key = state.dev_jwt_keypair.as_ref()
            .map(|k| k.public_key())
            .ok_or_else(|| AppError::Unauthorized("Dev auth enabled but keypair missing".to_string()))?;

        let claims = public_key.verify_token::<CustomClaims>(token, None)
            .map_err(|e| AppError::Unauthorized(format!("Invalid dev token: {e}")))?;

        let sub = claims.subject.ok_or_else(|| AppError::Unauthorized("Missing subject".to_string()))?;
        let role = claims.custom.sward_roles.first().cloned();
        Ok((sub, role))
    } else {
        // Validate production Keycloak JWT signature using JWKS public keys
        let decoded = state.jwt_decoder.verify(token).await
            .map_err(|e| AppError::Unauthorized(format!("JWT signature verification failed: {e}")))?;

        Ok((decoded.claims.sub, decoded.claims.roles.first().cloned()))
    }
}
```

#### Mitigation B: Fix Delta Sync SQL Foreign Key JOIN & Capture Checkpoint Early

```rust
// BEFORE (Vulnerable - Incorrect JOIN target & delayed checkpoint timestamp)
// file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/sync.rs#L153

// AFTER (Hardened - Correct JOIN condition & capture checkpoint prior to data fetches)
pub async fn delta_sync(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(params): Query<SyncQuery>,
) -> Result<Json<SyncResponse>, AppError> {
    // Capture checkpoint at start of handler to prevent timestamp window gaps
    let checkpoint = Utc::now();
    let since: DateTime<Utc> = params.since.unwrap_or_else(|| DateTime::from_timestamp(0, 0).unwrap());

    // ...
    let fertilisation_plans = if is_admin {
        sqlx::query_as::<_, FertilisationPlan>(
            "SELECT fp.id, fp.field_id, fp.crop_type, fp.target_yield, fp.nitrogen_requirement, fp.phosphorus_requirement, fp.potassium_requirement, fp.application_date, fp.updated_at, fp.is_deleted FROM fertilisation_plans fp WHERE fp.updated_at > $1"
        )
        .bind(since)
        .fetch_all(&state.db_pool)
        .await?
    } else {
        // Correct JOIN: f.farm_id = fa.id
        sqlx::query_as::<_, FertilisationPlan>(
            "SELECT fp.id, fp.field_id, fp.crop_type, fp.target_yield, fp.nitrogen_requirement, fp.phosphorus_requirement, fp.potassium_requirement, fp.application_date, fp.updated_at, fp.is_deleted FROM fertilisation_plans fp JOIN fields f ON fp.field_id = f.id JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = $1 AND fp.updated_at > $2"
        )
        .bind(user_id)
        .bind(since)
        .fetch_all(&state.db_pool)
        .await?
    };
    // ...
```

#### Mitigation C: Harden Client Outbox Retry Handling & Cache Invalidation

```typescript
// BEFORE (Vulnerable - Unhandled 401/403 deadlock in sync-engine.service.ts)
// file:///Users/bengreene/Development/polecatworks/sward-warden/sw-fe-container/src/app/services/sync-engine.service.ts#L251

// AFTER (Hardened - Backoff and mark auth-failed outbox entries to avoid deadlocks)
} catch (error: any) {
  this.logger.error(`SYNC ENGINE: Error processing entry ${entry.id}:`, error);
  const newRetryCount = (entry.retryCount || 0) + 1;

  if (error && (error.status === 403 || error.status === 401)) {
    // Update timestamp and retry count so backoff interval applies to auth failures
    await entry.patch({
      retryCount: newRetryCount,
      timestamp: new Date().toISOString(),
    });
    this.syncStateService.setError('Authentication required');
    return; // Exit cycle gracefully without unhandled exception throw
  }
```

```rust
// BEFORE (Vulnerable - Invalid cache invalidation key in farms.rs)
// file:///Users/bengreene/Development/polecatworks/sward-warden/sw-be-container/src/webserver/farms.rs#L201

// AFTER (Hardened - Invalidate target owner's cache key)
state.farms_cache.write().await.remove(&target_user_id);
```
