mod cli;
mod config;
mod server;

use clap::Parser;
use cli::{Cli, Commands};
use config::AppConfig;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Serve => {
            let config = AppConfig::load().unwrap_or_else(|_| AppConfig {
                database_url: "".to_string(),
                server_addr: "0.0.0.0:8080".to_string(),
                health_addr: "0.0.0.0:8079".to_string(),
            });

            let app_router = server::app_router();
            let health_router = server::health_router();

            let app_listener = TcpListener::bind(&config.server_addr).await.unwrap();
            let health_listener = TcpListener::bind(&config.health_addr).await.unwrap();

            println!("App listening on {}", config.server_addr);
            println!("Health listening on {}", config.health_addr);

            tokio::spawn(async move {
                axum::serve(health_listener, health_router).await.unwrap();
            });

            axum::serve(app_listener, app_router).await.unwrap();
        }
        Commands::Version => {
            println!("sp-be {}", env!("CARGO_PKG_VERSION"));
        }
        Commands::Migrate => {
            println!("Migrating database...");
        }
    }
}
