use crate::error::AppError;
use crate::models::User;
use crate::state::AppState;
use axum::{Json, extract::State};

// References more than 3 PRDs
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
        sqlx::query_as::<_, User>("SELECT u.id, u.name, u.email, u.role, u.phone, u.description, u.is_suspended, ARRAY_AGG(m.name) FILTER (WHERE m.name IS NOT NULL) AS modules FROM users u LEFT JOIN user_modules um ON u.id = um.user_id LEFT JOIN modules m ON um.module_id = m.id GROUP BY u.id")
            .fetch_all(&state.db_pool)
            .await;
    Ok(Json(users?))
}

// References more than 3 PRDs
pub async fn create_user(
    State(state): State<AppState>,
    Json(user): Json<User>,
) -> Result<Json<User>, AppError> {
    let mut tx = state.db_pool.begin().await?;
    let new_user: User = sqlx::query_as(
        "INSERT INTO users (name, email, role, phone, description, is_suspended) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, phone, description, is_suspended, NULL AS modules",
    )
    .bind(&user.name)
    .bind(&user.email)
    .bind(&user.role)
    .bind(&user.phone)
    .bind(&user.description)
    .bind(user.is_suspended)
    .fetch_one(&mut *tx)
    .await?;

    if let Some(modules) = &user.modules {
        for module in modules {
            sqlx::query("INSERT INTO user_modules (user_id, module_id) SELECT $1, id FROM modules WHERE name = $2")
                .bind(new_user.id)
                .bind(module)
                .execute(&mut *tx)
                .await?;
        }
    }
    tx.commit().await?;

    let final_user = sqlx::query_as::<_, User>(
        "SELECT u.id, u.name, u.email, u.role, u.phone, u.description, u.is_suspended, ARRAY_AGG(m.name) FILTER (WHERE m.name IS NOT NULL) AS modules FROM users u LEFT JOIN user_modules um ON u.id = um.user_id LEFT JOIN modules m ON um.module_id = m.id WHERE u.id = $1 GROUP BY u.id",
    )
    .bind(new_user.id)
    .fetch_one(&state.db_pool)
    .await?;

    Ok(Json(final_user))
}

// References more than 3 PRDs
pub async fn get_user(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>(
        "SELECT u.id, u.name, u.email, u.role, u.phone, u.description, u.is_suspended, ARRAY_AGG(m.name) FILTER (WHERE m.name IS NOT NULL) AS modules FROM users u LEFT JOIN user_modules um ON u.id = um.user_id LEFT JOIN modules m ON um.module_id = m.id WHERE u.id = $1 GROUP BY u.id",
    )
    .bind(id)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(user))
}

// References more than 3 PRDs
pub async fn update_user(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<i64>,
    Json(user): Json<User>,
) -> Result<Json<User>, AppError> {
    let mut tx = state.db_pool.begin().await?;

    sqlx::query(
        "UPDATE users SET name = $1, email = $2, role = $3, phone = $4, description = $5, is_suspended = $6 WHERE id = $7",
    )
    .bind(&user.name)
    .bind(&user.email)
    .bind(&user.role)
    .bind(&user.phone)
    .bind(&user.description)
    .bind(user.is_suspended)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if let Some(modules) = &user.modules {
        sqlx::query("DELETE FROM user_modules WHERE user_id = $1").bind(id).execute(&mut *tx).await?;
        for module in modules {
            sqlx::query("INSERT INTO user_modules (user_id, module_id) SELECT $1, id FROM modules WHERE name = $2")
                .bind(id)
                .bind(module)
                .execute(&mut *tx)
                .await?;
        }
    }

    tx.commit().await?;

    let updated_user = sqlx::query_as::<_, User>(
        "SELECT u.id, u.name, u.email, u.role, u.phone, u.description, u.is_suspended, ARRAY_AGG(m.name) FILTER (WHERE m.name IS NOT NULL) AS modules FROM users u LEFT JOIN user_modules um ON u.id = um.user_id LEFT JOIN modules m ON um.module_id = m.id WHERE u.id = $1 GROUP BY u.id",
    )
    .bind(id)
    .fetch_one(&state.db_pool)
    .await?;

    Ok(Json(updated_user))
}

// References more than 3 PRDs
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
