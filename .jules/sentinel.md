## 2024-04-25 - Prevent DB Info Exposure
**Vulnerability:** The Axum backend was mapping `sqlx::Error` directly to `MyError::Message`, which returned the stringified internal database error to the client, exposing schema details.
**Learning:** Returning unhandled database errors directly in API responses violates CWE-200 (Information Exposure).
**Prevention:** Wrap database errors in custom error variants (e.g., `MyError::DatabaseError`), log the exact error server-side for debugging, and return a generic 500 error response to the client. Avoid `map_err(|e| MyError::Message(e))` and use the `?` operator for direct error conversion.
