use figment::{
    Figment,
    providers::{Env, Format, Yaml},
};
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

#[derive(Deserialize, Clone)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub webservice: WebServiceConfig,
    pub hams: HamsConfig,
    #[serde(default)]
    pub runtime: ThreadRuntime,
    pub startup_checks: StartupCheckConfig,
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
    pub fn load() -> Result<Self, Box<figment::Error>> {
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        Figment::new()
            .merge(Yaml::file("config/default.yaml"))
            .merge(Yaml::file(format!("config/{}.yaml", run_mode)))
            .merge(Yaml::file("config/secrets.yaml"))
            .merge(Env::prefixed("SP_BE__").split("__"))
            .extract()
            .map_err(Box::new)
    }
}
