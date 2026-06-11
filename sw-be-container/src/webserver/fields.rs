use crate::error::AppError;
use crate::models::Field;
use crate::state::AppState;
use crate::webserver::auth::UserId;
use axum::{
    Json,
    extract::{Path, State},
};
use reqwest::StatusCode;

pub async fn list_fields(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<Field>>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    let fields = if is_admin {
        sqlx::query_as::<_, Field>(
            "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, ST_AsText(f.geom) as geometry_wkt, f.updated_at, f.is_deleted FROM fields f WHERE f.is_deleted = FALSE"
        )
        .fetch_all(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Field>(
            "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, ST_AsText(f.geom) as geometry_wkt, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE fa.user_id = $1 AND f.is_deleted = FALSE"
        )
        .bind(user_id)
        .fetch_all(&state.db_pool)
        .await?
    };
    Ok(Json(fields))
}

pub async fn get_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<Json<Field>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    let field = if is_admin {
        sqlx::query_as::<_, Field>(
            "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, ST_AsText(f.geom) as geometry_wkt, f.updated_at, f.is_deleted FROM fields f WHERE f.id = $1 AND f.is_deleted = FALSE"
        )
        .bind(id)
        .fetch_one(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Field>(
            "SELECT f.id, f.farm_id, f.name, f.area_hectares, f.land_use, ST_AsText(f.geom) as geometry_wkt, f.updated_at, f.is_deleted FROM fields f JOIN farms fa ON f.farm_id = fa.id WHERE f.id = $1 AND fa.user_id = $2 AND f.is_deleted = FALSE"
        )
        .bind(id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?
    };
    Ok(Json(field))
}

pub async fn create_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(mut field): Json<Field>,
) -> Result<Json<Field>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    if is_admin {
        // Verify the target farm exists
        let farm_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND is_deleted = FALSE)",
        )
        .bind(field.farm_id)
        .fetch_one(&state.db_pool)
        .await?;

        if !farm_exists {
            return Err(AppError::BadRequest(
                "Target farm does not exist".to_string(),
            ));
        }
    } else {
        // Check if the user has any active farms
        let has_farms = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM farms WHERE user_id = $1 AND is_deleted = FALSE)",
        )
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?;

        if !has_farms {
            // Create "My Farm" automatically
            let new_farm = sqlx::query_as::<_, crate::models::Farm>(
                "INSERT INTO farms (user_id, name, location, has_derogation) VALUES ($1, $2, $3, $4) RETURNING id, user_id, name, location, has_derogation, updated_at, is_deleted"
            )
            .bind(user_id)
            .bind("My Farm")
            .bind("Default Location")
            .bind(false)
            .fetch_one(&state.db_pool)
            .await?;
            state.farms_cache.write().await.remove(&user_id);
            field.farm_id = new_farm.id.unwrap();
        } else {
            // Verify the target farm belongs to the user
            let farm_belongs = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)",
            )
            .bind(field.farm_id)
            .bind(user_id)
            .fetch_one(&state.db_pool)
            .await?;

            if !farm_belongs {
                return Err(AppError::Forbidden(
                    "Target farm is invalid or unauthorized".to_string(),
                ));
            }
        }
    }

    let parsed_wkt = field.geometry_wkt.as_deref().filter(|s| !s.trim().is_empty());

    let new_field = sqlx::query_as::<_, Field>(
        "INSERT INTO fields (farm_id, name, area_hectares, land_use, geom) VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326)) RETURNING id, farm_id, name, area_hectares, land_use, ST_AsText(geom) as geometry_wkt, updated_at, is_deleted"
    )
    .bind(field.farm_id)
    .bind(&field.name)
    .bind(field.area_hectares)
    .bind(&field.land_use)
    .bind(parsed_wkt)
    .fetch_one(&state.db_pool)
    .await?;
    Ok(Json(new_field))
}

pub async fn delete_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
) -> Result<StatusCode, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    if is_admin {
        sqlx::query("UPDATE fields SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1")
            .bind(id)
            .execute(&state.db_pool)
            .await?;
    } else {
        sqlx::query(
            "UPDATE fields SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND farm_id IN (SELECT id FROM farms WHERE user_id = $2)"
        )
        .bind(id)
        .bind(user_id)
        .execute(&state.db_pool)
        .await?;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_field(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(id): Path<i64>,
    Json(field): Json<Field>,
) -> Result<Json<Field>, AppError> {
    let is_admin = crate::webserver::auth::check_is_admin(&state.db_pool, user_id).await;

    if is_admin {
        // Verify destination farm exists
        let farm_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND is_deleted = FALSE)",
        )
        .bind(field.farm_id)
        .fetch_one(&state.db_pool)
        .await?;

        if !farm_exists {
            return Err(AppError::BadRequest(
                "Destination farm does not exist".to_string(),
            ));
        }
    } else {
        // 1. Verify that the destination farm belongs to the user
        let farm_belongs = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM farms WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE)",
        )
        .bind(field.farm_id)
        .bind(user_id)
        .fetch_one(&state.db_pool)
        .await?;

        if !farm_belongs {
            return Err(AppError::Forbidden(
                "Destination farm is invalid or unauthorized".to_string(),
            ));
        }
    }

    let parsed_wkt = field.geometry_wkt.as_deref().filter(|s| !s.trim().is_empty());

    // 2. Perform the update
    let updated_field = if is_admin {
        sqlx::query_as::<_, Field>(
            "UPDATE fields SET farm_id = $1, name = $2, area_hectares = $3, land_use = $4, geom = ST_GeomFromText($6, 4326), updated_at = NOW() WHERE id = $5 AND is_deleted = FALSE RETURNING id, farm_id, name, area_hectares, land_use, ST_AsText(geom) as geometry_wkt, updated_at, is_deleted"
        )
        .bind(field.farm_id)
        .bind(&field.name)
        .bind(field.area_hectares)
        .bind(&field.land_use)
        .bind(id)
        .bind(parsed_wkt)
        .fetch_one(&state.db_pool)
        .await?
    } else {
        sqlx::query_as::<_, Field>(
            "UPDATE fields SET farm_id = $1, name = $2, area_hectares = $3, land_use = $4, geom = ST_GeomFromText($7, 4326), updated_at = NOW() WHERE id = $5 AND farm_id IN (SELECT id FROM farms WHERE user_id = $6) AND is_deleted = FALSE RETURNING id, farm_id, name, area_hectares, land_use, ST_AsText(geom) as geometry_wkt, updated_at, is_deleted"
        )
        .bind(field.farm_id)
        .bind(&field.name)
        .bind(field.area_hectares)
        .bind(&field.land_use)
        .bind(id)
        .bind(user_id)
        .bind(parsed_wkt)
        .fetch_one(&state.db_pool)
        .await?
    };

    Ok(Json(updated_field))
}
