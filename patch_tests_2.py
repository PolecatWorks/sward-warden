with open("sw-be-container/src/webserver/tests.rs", "r") as f:
    content = f.read()

search = """    let config = AppConfig {
        database: crate::config::DatabaseConfig {
            url: "postgres://localhost:5432/swarddb_test"
                .parse::<url::Url>()
                .unwrap()
                .into(),
            max_connections: 5,
        },
        webservice: crate::config::WebServiceConfig {
            address: "http://0.0.0.0:0".parse().unwrap(),
            forwarding_headers: vec![],
        },
        hams: ::hams::hams::config::HamsConfig::default(),
        runtime: crate::tokio_tools::ThreadRuntime::default(),
        startup_checks: crate::config::StartupCheckConfig {
            fails: 5,
            timeout: std::time::Duration::from_secs(5),
            enabled: false,
        },
    };"""

replace = """    let config = AppConfig {
        database: crate::config::DatabaseConfig {
            url: "postgres://localhost:5432/swarddb_test"
                .parse::<url::Url>()
                .unwrap()
                .into(),
            max_connections: 5,
        },
        webservice: crate::config::WebServiceConfig {
            address: "http://0.0.0.0:0".parse().unwrap(),
            forwarding_headers: vec![],
        },
        hams: ::hams::hams::config::HamsConfig::default(),
        runtime: crate::tokio_tools::ThreadRuntime::default(),
        startup_checks: crate::config::StartupCheckConfig {
            fails: 5,
            timeout: std::time::Duration::from_secs(5),
            enabled: false,
        },
        debugging: crate::config::DebuggingConfig::default(),
    };"""

if search in content:
    content = content.replace(search, replace)
    with open("sw-be-container/src/webserver/tests.rs", "w") as f:
        f.write(content)
    print("Tests patched 2")
else:
    print("Search string not found in tests")
