import sys

with open("sw-be-container/src/main.rs", "r") as f:
    content = f.read()

# For Serve
search_serve = """        Commands::Serve => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            let ct = CancellationToken::new();
            run_in_tokio(&config.runtime, service_cancellable(ct, config.clone()))?;
        }"""
replace_serve = """        Commands::Serve => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            let delay = config.debugging.fail_debug_delay.clone();
            let ct = CancellationToken::new();
            if let Err(e) = run_in_tokio(&config.runtime, service_cancellable(ct, config.clone())) {
                if let Some(d) = delay {
                    tracing::error!("Serve failed: {}. Sleeping for {:?} before exiting...", e, d);
                    std::thread::sleep(d);
                }
                return Err(e);
            }
        }"""
content = content.replace(search_serve, replace_serve)

# For Migrate
search_migrate = """        Commands::Migrate => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            run_in_tokio(&config.runtime, async move {
                let db_url: url::Url = config.database.url.clone().into();
                let db_pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(1)
                    .connect(db_url.as_str())
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to connect to database: {e}")))?;

                sqlx::migrate!()
                    .run(&db_pool)
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to run migrations: {e}")))?;

                println!("Migrations completed successfully.");
                Ok(())
            })?;
        }"""
replace_migrate = """        Commands::Migrate => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            let delay = config.debugging.fail_debug_delay.clone();
            if let Err(e) = run_in_tokio(&config.runtime, async move {
                let db_url: url::Url = config.database.url.clone().into();
                let db_pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(1)
                    .connect(db_url.as_str())
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to connect to database: {e}")))?;

                sqlx::migrate!()
                    .run(&db_pool)
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to run migrations: {e}")))?;

                println!("Migrations completed successfully.");
                Ok(())
            }) {
                if let Some(d) = delay {
                    tracing::error!("Migrate failed: {}. Sleeping for {:?} before exiting...", e, d);
                    std::thread::sleep(d);
                }
                return Err(e);
            }
        }"""
content = content.replace(search_migrate, replace_migrate)

# For Seed
search_seed = """        Commands::Seed { user_id } => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            run_in_tokio(&config.runtime, async move {
                let db_url: url::Url = config.database.url.clone().into();
                let db_pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(1)
                    .connect(db_url.as_str())
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to connect to database: {e}")))?;
                seed::seed_database(&db_pool, *user_id).await
            })?;
        }"""
replace_seed = """        Commands::Seed { user_id } => {
            let config = AppConfig::load(&cli.config_path, &cli.secrets_dir)?;
            let delay = config.debugging.fail_debug_delay.clone();
            if let Err(e) = run_in_tokio(&config.runtime, async move {
                let db_url: url::Url = config.database.url.clone().into();
                let db_pool = sqlx::postgres::PgPoolOptions::new()
                    .max_connections(1)
                    .connect(db_url.as_str())
                    .await
                    .map_err(|e| AppError::Message(format!("Failed to connect to database: {e}")))?;
                seed::seed_database(&db_pool, *user_id).await
            }) {
                if let Some(d) = delay {
                    tracing::error!("Seed failed: {}. Sleeping for {:?} before exiting...", e, d);
                    std::thread::sleep(d);
                }
                return Err(e);
            }
        }"""
content = content.replace(search_seed, replace_seed)

with open("sw-be-container/src/main.rs", "w") as f:
    f.write(content)

print("Main patched successfully")
