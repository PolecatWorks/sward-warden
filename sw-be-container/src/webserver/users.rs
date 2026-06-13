use crate::error::AppError;
use crate::models::User;
use crate::state::AppState;
use axum::{Json, extract::State};

pub async fn list_users(State(state): State<AppState>) -> Result<Json<Vec<User>>, AppError> {
    let env = state
        .config
        .debugging
        .environment
        .as_deref()
        .unwrap_or("production");
    if env != "development" && env != "testing" {
        return Err(AppError::Forbidden(
            "User directory listing is disabled in this environment".to_string(),
        ));
    }

    let users =
        sqlx::query_as::<_, User>("SELECT id, name, email, role, phone, description FROM users")
            .fetch_all(&state.db_pool)
            .await;
    Ok(Json(users?))
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(user): Json<User>,
) -> Result<Json<User>, AppError> {
    let new_user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email, role, phone, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, description",
    )
    .bind(&user.name)
    .bind(&user.email)
    .bind(&user.role)
    .bind(&user.phone)
    .bind(&user.description)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_user?))
}

pub async fn get_user(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, name, email, role, phone, description FROM users WHERE id = $1",
    )
    .bind(id)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(user?))
}

pub async fn update_user(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
    Json(user): Json<User>,
) -> Result<Json<User>, AppError> {
    let updated_user = sqlx::query_as::<_, User>(
        "UPDATE users SET name = $1, email = $2, role = $3, phone = $4, description = $5 WHERE id = $6 RETURNING id, name, email, role, phone, description",
    )
    .bind(&user.name)
    .bind(&user.email)
    .bind(&user.role)
    .bind(&user.phone)
    .bind(&user.description)
    .bind(id)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(updated_user?))
}

pub async fn delete_user(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> Result<axum::http::StatusCode, AppError> {
    let env = state
        .config
        .debugging
        .environment
        .as_deref()
        .unwrap_or("production");
    if env != "development" && env != "testing" {
        return Err(AppError::Forbidden(
            "User deletion is disabled in this environment".to_string(),
        ));
    }

    let result = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(id)
        .execute(&state.db_pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    state.farms_cache.write().await.remove(&id);
    Ok(axum::http::StatusCode::NO_CONTENT)
}
