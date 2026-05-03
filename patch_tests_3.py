with open("sw-be-container/src/webserver/tests.rs", "r") as f:
    content = f.read()

search = """        startup_checks: crate::config::StartupCheckConfig {
            fails: 1,
            timeout: std::time::Duration::from_secs(1),
            enabled: false,
        },
    };"""

replace = """        startup_checks: crate::config::StartupCheckConfig {
            fails: 1,
            timeout: std::time::Duration::from_secs(1),
            enabled: false,
        },
        debugging: crate::config::DebuggingConfig::default(),
    };"""

if search in content:
    content = content.replace(search, replace)
    with open("sw-be-container/src/webserver/tests.rs", "w") as f:
        f.write(content)
    print("Tests patched 3")
else:
    print("Search string not found in tests 3")
