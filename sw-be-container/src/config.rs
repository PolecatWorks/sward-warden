use figment::{
    Figment,
    providers::{Env, Format, Yaml},
};
use figment_file_provider_adapter::FileAdapter;
use serde::Deserialize;
use std::time::Duration;
use url::Url;

use ::hams::hams::config::HamsConfig;

use crate::tokio_tools::ThreadRuntime;

#[derive(Deserialize, Debug, Clone)]
pub struct UrlWithUsernamePassword {
    pub url: Url,
    pub username: Option<String>,
    pub password: Option<String>,
}

impl From<UrlWithUsernamePassword> for Url {
    fn from(value: UrlWithUsernamePassword) -> Self {
        let mut return_url = value.url;
        if let Some(password) = value.password {
            return_url.set_password(Some(&password)).unwrap();
        }
        if let Some(username) = value.username {
            return_url.set_username(&username).unwrap();
        }
        return_url
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub webservice: WebServiceConfig,
    pub hams: HamsConfig,
    #[serde(default)]
    pub runtime: ThreadRuntime,
    pub startup_checks: StartupCheckConfig,
    #[serde(default)]
    pub debugging: DebuggingConfig,
}

#[derive(Deserialize, Debug, Clone, Default)]
pub struct DebuggingConfig {
    #[serde(with = "humantime_serde", default)]
    pub fail_debug_delay: Option<Duration>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct DatabaseConfig {
    pub url: UrlWithUsernamePassword,
    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
}

fn default_max_connections() -> u32 {
    10
}

#[derive(Deserialize, Debug, Clone)]
pub struct WebServiceConfig {
    pub address: Url,
    #[serde(default)]
    pub forwarding_headers: Vec<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct StartupCheckConfig {
    pub fails: u32,
    #[serde(with = "humantime_serde")]
    pub timeout: Duration,
    pub enabled: bool,
}

impl AppConfig {
    pub fn load(config_path: &std::path::Path, secrets_dir: &std::path::Path) -> Result<Self, Box<figment::Error>> {
        Figment::new()
            .merge(FileAdapter::wrap(Yaml::file(config_path)).relative_to_dir(secrets_dir))
            .merge(Env::prefixed("SP_BE__").split("__"))
            .extract()
            .map_err(Box::new)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_config_load_without_credentials() {
        // Ensure no env vars are interfering
        unsafe {
            env::remove_var("SP_BE__DATABASE__URL__USERNAME");
            env::remove_var("SP_BE__DATABASE__URL__PASSWORD");
        }

        let config_res = AppConfig::load(std::path::Path::new("config/default.yaml"), std::path::Path::new("config"));
        assert!(
            config_res.is_ok(),
            "Config should load even without credentials: {:?}",
            config_res.err()
        );
        let config = config_res.unwrap();

        assert!(config.database.url.username.is_none());
        assert!(config.database.url.password.is_none());
    }

    #[test]
    fn test_config_load_with_env_vars() {
        unsafe {
            env::set_var("SP_BE__DATABASE__URL__USERNAME", "envuser");
            env::set_var("SP_BE__DATABASE__URL__PASSWORD", "envpass");
        }

        let config = AppConfig::load(std::path::Path::new("config/default.yaml"), std::path::Path::new("config")).unwrap();

        unsafe {
            env::remove_var("SP_BE__DATABASE__URL__USERNAME");
            env::remove_var("SP_BE__DATABASE__URL__PASSWORD");
        }

        assert_eq!(config.database.url.username.as_deref(), Some("envuser"));
        assert_eq!(config.database.url.password.as_deref(), Some("envpass"));
    }
}
