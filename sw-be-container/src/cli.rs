use clap::{Parser, Subcommand};

#[derive(Parser, Debug, PartialEq)]
#[command(name = "sw-be", about = "Sward management be", version)]
pub struct Cli {
    #[arg(short, long)]
    pub config_path: std::path::PathBuf,

    #[arg(short, long)]
    pub secrets_dir: std::path::PathBuf,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug, PartialEq)]
pub enum Commands {
    /// Start the main application server
    Serve,
    /// Display application version
    Version,
    /// Execute schema migrations against PostgreSQL
    Migrate,
    /// Seed the database with realistic sample data
    Seed {
        /// The user ID to seed data for
        #[arg(long, default_value_t = 1)]
        user_id: i64,
    },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cli_serve() {
        let cli = Cli::try_parse_from(&["sw-be", "--config-path", "cfg.yaml", "--secrets-dir", "sec", "serve"]).unwrap();
        assert_eq!(cli.command, Commands::Serve);
    }

    #[test]
    fn test_cli_version() {
        let cli = Cli::try_parse_from(&["sw-be", "--config-path", "cfg.yaml", "--secrets-dir", "sec", "version"]).unwrap();
        assert_eq!(cli.command, Commands::Version);
    }

    #[test]
    fn test_cli_migrate() {
        let cli = Cli::try_parse_from(&["sw-be", "--config-path", "cfg.yaml", "--secrets-dir", "sec", "migrate"]).unwrap();
        assert_eq!(cli.command, Commands::Migrate);
    }

    #[test]
    fn test_cli_invalid_command() {
        let cli = Cli::try_parse_from(&["sw-be", "invalid"]);
        assert!(cli.is_err());
    }
}
