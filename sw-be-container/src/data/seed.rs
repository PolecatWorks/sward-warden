use crate::error::AppError;
use chrono::Utc;
use sqlx::{PgPool, QueryBuilder};
use tracing::info;

pub async fn seed_database(pool: &PgPool, user_id: i64) -> Result<(), AppError> {
    info!("Seeding database for user_id: {}", user_id);

    // Ensure user exists
    sqlx::query(
        "INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, 'user') ON CONFLICT (id) DO NOTHING"
    ).bind(user_id).bind("Demo User").bind(format!("user{}@example.com", user_id))
    .execute(pool)
    .await
    .map_err(|e| AppError::Message(format!("Failed to ensure user: {e}")))?;

    // Ensure admin user exists
    sqlx::query(
        "INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (id) DO NOTHING"
    ).bind(999i64).bind("Demo Admin").bind("admin@example.com")
    .execute(pool)
    .await
    .map_err(|e| AppError::Message(format!("Failed to ensure admin user: {e}")))?;

    for i in 1..=3 {
        let farm_name = format!("Farm {}", i);
        let location = format!("County {}, NI", ["Down", "Antrim", "Tyrone"][i - 1]);

        let farm_id: i64 = sqlx::query_scalar::<_, i64>(
            "INSERT INTO farms (user_id, name, location, updated_at) VALUES ($1, $2, $3, $4) RETURNING id"
        ).bind(user_id).bind(farm_name).bind(location).bind(Utc::now())
        .fetch_one(pool)
        .await
        .map_err(|e| AppError::Message(format!("Failed to insert farm: {e}")))?;

        for j in 1..=5 {
            let field_name = format!("Field {}-{}", i, j);
            let area = 2.5 + (j as f64) * 1.2;

            let field_id: i64 = sqlx::query_scalar::<_, i64>(
                "INSERT INTO fields (farm_id, name, area_hectares, updated_at) VALUES ($1, $2, $3, $4) RETURNING id"
            ).bind(farm_id).bind(field_name).bind(area).bind(Utc::now())
            .fetch_one(pool)
            .await
            .map_err(|e| AppError::Message(format!("Failed to insert field: {e}")))?;

            let mut events_to_insert = Vec::new();

            for k in 1..=10 {
                let event_type = if k % 3 == 0 { "planned" } else { "completed" };
                let description = format!("Slurry application #{} - {}m3 applied", k, k * 50);
                let date = format!("2024-05-{:02}", k + 10);

                events_to_insert.push((
                    field_id,
                    event_type.to_string(),
                    description,
                    date,
                    Utc::now(),
                ));
            }

            if !events_to_insert.is_empty() {
                let mut query_builder = QueryBuilder::new(
                    "INSERT INTO events (field_id, event_type, description, date, updated_at) ",
                );

                query_builder.push_values(events_to_insert, |mut b, event| {
                    b.push_bind(event.0)
                        .push_bind(event.1)
                        .push_bind(event.2)
                        .push_bind(event.3)
                        .push_bind(event.4);
                });

                let query = query_builder.build();

                query
                    .execute(pool)
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to insert events: {e}")))?;
            }
        }
    }

    info!("Seeding complete!");
    Ok(())
}
