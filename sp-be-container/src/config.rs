use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::env;

#[derive(Debug, Deserialize, PartialEq)]
pub struct AppConfig {
    pub database_url: String,
    pub server_addr: String,
    pub health_addr: String,
}

impl AppConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let run_mode = env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let builder = Config::builder()
            .add_source(File::with_name("config/default").required(false))
            .add_source(File::with_name(&format!("config/{}", run_mode)).required(false))
            .add_source(File::with_name("config/secrets").required(false))
            .add_source(Environment::with_prefix("SP_BE").separator("__"));

        let config = builder.build()?;
        config.try_deserialize()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_test_env() {
        let _ = fs::create_dir_all("config");
        let default_config = r#"
database_url: "postgres://user:pass@localhost:5432/db"
server_addr: "0.0.0.0:8080"
health_addr: "0.0.0.0:8079"
"#;
        fs::write("config/default.yaml", default_config).unwrap();
        unsafe {
            env::set_var("RUN_MODE", "development");
            env::remove_var("SP_BE__DATABASE_URL");
            env::remove_var("SP_BE__SERVER_ADDR");
            env::remove_var("SP_BE__HEALTH_ADDR");
        }
    }

    fn teardown_test_env() {
        let _ = fs::remove_dir_all("config");
        unsafe {
            env::remove_var("RUN_MODE");
            env::remove_var("SP_BE__DATABASE_URL");
            env::remove_var("SP_BE__SERVER_ADDR");
            env::remove_var("SP_BE__HEALTH_ADDR");
        }
    }

    #[test]
    fn test_load_default_config() {
        setup_test_env();
        let config = AppConfig::load().unwrap();
        assert_eq!(config.database_url, "postgres://user:pass@localhost:5432/db");
        assert_eq!(config.server_addr, "0.0.0.0:8080");
        assert_eq!(config.health_addr, "0.0.0.0:8079");
        teardown_test_env();
    }

    #[test]
    fn test_env_override() {
        setup_test_env();
        unsafe {
            env::set_var("SP_BE__DATABASE_URL", "postgres://prod:prod@db:5432/prod_db");
            env::set_var("SP_BE__SERVER_ADDR", "127.0.0.1:9090");
            env::set_var("SP_BE__HEALTH_ADDR", "127.0.0.1:9091");
        }

        let config = AppConfig::load().unwrap();
        assert_eq!(config.database_url, "postgres://prod:prod@db:5432/prod_db");
        assert_eq!(config.server_addr, "127.0.0.1:9090");
        assert_eq!(config.health_addr, "127.0.0.1:9091");
        teardown_test_env();
    }

    #[test]
    fn test_secret_file_override() {
        setup_test_env();
        let secret_config = r#"
database_url: "postgres://secret:secret@secret-db:5432/secret_db"
"#;
        fs::write("config/secrets.yaml", secret_config).unwrap();

        let config = AppConfig::load().unwrap();
        assert_eq!(config.database_url, "postgres://secret:secret@secret-db:5432/secret_db");
        assert_eq!(config.server_addr, "0.0.0.0:8080");

        teardown_test_env();
    }
}
