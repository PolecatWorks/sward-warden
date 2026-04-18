use clap::{Parser, Subcommand};

#[derive(Parser, Debug, PartialEq)]
#[command(name = "sp-be", about = "Slurry management backend", version)]
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cli_serve() {
        let cli = Cli::try_parse_from(&["sp-be", "serve"]).unwrap();
        assert_eq!(cli.command, Commands::Serve);
    }

    #[test]
    fn test_cli_version() {
        let cli = Cli::try_parse_from(&["sp-be", "version"]).unwrap();
        assert_eq!(cli.command, Commands::Version);
    }

    #[test]
    fn test_cli_migrate() {
        let cli = Cli::try_parse_from(&["sp-be", "migrate"]).unwrap();
        assert_eq!(cli.command, Commands::Migrate);
    }

    #[test]
    fn test_cli_invalid_command() {
        let cli = Cli::try_parse_from(&["sp-be", "invalid"]);
        assert!(cli.is_err());
    }
}
