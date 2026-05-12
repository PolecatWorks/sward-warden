use crate::error::AppError;
use crate::models::User;
use crate::state::AppState;
use axum::{Json, extract::State};

pub async fn list_users(State(state): State<AppState>) -> Result<Json<Vec<User>>, AppError> {
    let users = sqlx::query_as::<_, User>("SELECT id, name, email, role FROM users")
        .fetch_all(&state.db_pool)
        .await;
    Ok(Json(users?))
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(user): Json<User>,
) -> Result<Json<User>, AppError> {
    let new_user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, role",
    )
    .bind(&user.name)
    .bind(&user.email)
    .fetch_one(&state.db_pool)
    .await;
    Ok(Json(new_user?))
}
