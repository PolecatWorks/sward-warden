use clap::{Parser, Subcommand};

#[derive(Parser, Debug, PartialEq)]
#[command(name = "sw-be", about = "Sward management backend", version)]
pub struct Cli {
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
        let cli = Cli::try_parse_from(&["sw-be", "serve"]).unwrap();
        assert_eq!(cli.command, Commands::Serve);
    }

    #[test]
    fn test_cli_version() {
        let cli = Cli::try_parse_from(&["sw-be", "version"]).unwrap();
        assert_eq!(cli.command, Commands::Version);
    }

    #[test]
    fn test_cli_migrate() {
        let cli = Cli::try_parse_from(&["sw-be", "migrate"]).unwrap();
        assert_eq!(cli.command, Commands::Migrate);
    }

    #[test]
    fn test_cli_invalid_command() {
        let cli = Cli::try_parse_from(&["sw-be", "invalid"]);
        assert!(cli.is_err());
    }
}
