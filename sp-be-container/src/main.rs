mod cli;
mod config;
mod server;

use clap::Parser;
use cli::{Cli, Commands};
use config::AppConfig;
use std::net::SocketAddr;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Serve => {
            let config = AppConfig::load().unwrap_or_else(|_| AppConfig {
                database_url: "".to_string(),
                server_port: 8080,
                health_port: 8079,
            });

            let app_addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
            let health_addr = SocketAddr::from(([0, 0, 0, 0], config.health_port));

            let app_router = server::app_router();
            let health_router = server::health_router();

            let app_listener = TcpListener::bind(&app_addr).await.unwrap();
            let health_listener = TcpListener::bind(&health_addr).await.unwrap();

            println!("App listening on {}", app_addr);
            println!("Health listening on {}", health_addr);

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
