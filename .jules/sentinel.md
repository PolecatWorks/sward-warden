## 2025-05-15 - Hardcoded Credentials in Configuration

**Vulnerability:** Hardcoded database credentials (username and password) in `sw-be-container/config/default.yaml`.

**Learning:** Storing secrets in version-controlled configuration files is a high-risk practice that exposes credentials to anyone with access to the repository. While convenient for local development, it violates security principles and can lead to production compromises if these defaults are not overridden correctly.

**Prevention:** Always use environment variables or external secret management systems for sensitive configuration. Provide a template or documentation for required environment variables (e.g., `SP_BE__DATABASE__URL__PASSWORD`) instead of hardcoding default values. Use `.gitignore` to prevent local secret files (like `secrets.yaml`) from being committed.
