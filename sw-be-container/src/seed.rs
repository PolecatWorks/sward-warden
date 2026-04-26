use sqlx::PgPool;
use crate::error::MyError;
use tracing::info;
use chrono::Utc;

pub async fn seed_database(pool: &PgPool, user_id: i64) -> Result<(), MyError> {
    info!("Seeding database for user_id: {}", user_id);

    // Ensure user exists
    sqlx::query!(
        "INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
        user_id, "Demo User", format!("user{}@example.com", user_id)
    )
    .execute(pool)
    .await
    .map_err(|e| MyError::Message(format!("Failed to ensure user: {e}")))?;

    for i in 1..=3 {
        let farm_name = format!("Farm {}", i);
        let location = format!("County {}, NI", ["Down", "Antrim", "Tyrone"][i-1]);

        let farm_id: i64 = sqlx::query!(
            "INSERT INTO farms (user_id, name, location, updated_at) VALUES ($1, $2, $3, $4) RETURNING id",
            user_id, farm_name, location, Utc::now()
        )
        .fetch_one(pool)
        .await
        .map_err(|e| MyError::Message(format!("Failed to insert farm: {e}")))?
        .id;

        for j in 1..=5 {
            let field_name = format!("Field {}-{}", i, j);
            let area = 2.5 + (j as f64) * 1.2;

            let field_id: i64 = sqlx::query!(
                "INSERT INTO fields (farm_id, name, area_hectares, updated_at) VALUES ($1, $2, $3, $4) RETURNING id",
                farm_id, field_name, area, Utc::now()
            )
            .fetch_one(pool)
            .await
            .map_err(|e| MyError::Message(format!("Failed to insert field: {e}")))?
            .id;

            for k in 1..=10 {
                let event_type = if k % 3 == 0 { "planned" } else { "completed" };
                let description = format!("Slurry application #{} - {}m3 applied", k, k * 50);
                let date = format!("2024-05-{:02}", k + 10);

                sqlx::query!(
                    "INSERT INTO events (field_id, event_type, description, date, updated_at) VALUES ($1, $2, $3, $4, $5)",
                    field_id, event_type, description, date, Utc::now()
                )
                .execute(pool)
                .await
                .map_err(|e| MyError::Message(format!("Failed to insert event: {e}")))?;
            }
        }
    }

    info!("Seeding complete!");
    Ok(())
}
