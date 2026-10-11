🎯 **What:** Replaced client-side string formatting of wildcard searches (`format!("{}%", year)`) with database-side string concatenation (`LIKE $2 || '%'`) when fetching applications by year.

⚠️ **Risk:** Formatting SQL query parameters dynamically via string interpolation in Rust (like `format!("{}%", value)`) bypasses standard query parameterization limits. If the variable is improperly sanitized or tainted, an attacker might be able to inject unexpected syntax or wildcards that increase the attack surface or allow logic bypass, ultimately leading to SQL Injection vulnerabilities.

🛡️ **Solution:** Altered the SQL query to include string concatenation on the PostgreSQL side (`|| '%'`) and passed the raw, unformatted `year_str` safely through `sqlx`'s `bind()` function. This guarantees the user input is parameterized as a string literal and eliminates the SQL injection vulnerability, which aligns with standard sqlx security best practices.
