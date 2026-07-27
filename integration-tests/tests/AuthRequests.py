import requests
from RequestsLibrary import RequestsLibrary
from robot.libraries.BuiltIn import BuiltIn

_token_cache = {}

class AuthRequests(RequestsLibrary):
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def _common_request(self, method, session, uri, **kwargs):
        # Determine the base URL
        be_base_url = BuiltIn().get_variable_value("${BE_BASE_URL}")
        if not be_base_url:
            be_base_url = "http://localhost:8080/sward"

        # Check if the request is to the auth token endpoint or well-known JWKS or health check
        is_bypass = (
            "/dev/auth/token" in uri
            or ".well-known/jwks.json" in uri
            or "/hams/alive" in uri
            or "/hams/ready" in uri
            or "/index.html" in uri
            or "8079" in uri  # health check port
        )

        if not is_bypass:
            headers = kwargs.get('headers') or {}
            # Convert to case-insensitive dictionary lookups
            headers_lower = {k.lower(): v for k, v in headers.items()}

            if 'authorization' not in headers_lower:
                # Extract X-User-ID and X-User-Role
                user_id = None
                role = None

                for k, v in list(headers.items()):
                    if k.lower() == 'x-user-id':
                        user_id = v
                        headers.pop(k)
                    elif k.lower() == 'x-user-role':
                        role = v
                        headers.pop(k)

                if user_id is None:
                    user_id = 1
                if role is None:
                    role = "user"

                enable_keycloak = BuiltIn().get_variable_value("${ENABLE_KEYCLOAK}", "false")
                if isinstance(enable_keycloak, str):
                    enable_keycloak = enable_keycloak.lower() in ("true", "1", "yes")

                cache_key = (str(user_id), str(role), bool(enable_keycloak))
                if cache_key not in _token_cache:
                    if enable_keycloak:
                        keycloak_realm_url = BuiltIn().get_variable_value("${KEYCLOAK_REALM_URL}", "http://keycloak.k8s/auth/realms/sw-dev")
                        client_id = BuiltIn().get_variable_value("${KEYCLOAK_CLIENT_ID}", "sward-warden-fe")
                        token_url = f"{keycloak_realm_url.rstrip('/')}/protocol/openid-connect/token"
                        username = BuiltIn().get_variable_value("${KEYCLOAK_USERNAME}", "devuser")
                        password = BuiltIn().get_variable_value("${KEYCLOAK_PASSWORD}", "devpassword")
                        try:
                            r = requests.post(
                                token_url,
                                data={
                                    "grant_type": "password",
                                    "client_id": client_id,
                                    "username": username,
                                    "password": password,
                                },
                                timeout=5
                            )
                            r.raise_for_status()
                            token = r.json().get("access_token")
                            if token:
                                _token_cache[cache_key] = token
                        except Exception as e:
                            BuiltIn().log(f"Failed to fetch Keycloak OIDC token: {e}", level="WARN")

                    if cache_key not in _token_cache:
                        clean_base = be_base_url.rstrip('/')
                        if clean_base.endswith('/sward'):
                            auth_url = f"{clean_base}/dev/auth/token"
                        else:
                            auth_url = f"{clean_base}/sward/dev/auth/token"
                        try:
                            r = requests.post(
                                auth_url,
                                json={"user_id": int(user_id) if str(user_id).isdigit() else 1, "role": str(role)},
                                timeout=5
                            )
                            r.raise_for_status()
                            token = r.json().get("access_token")
                            if token:
                                _token_cache[cache_key] = token
                        except Exception as e:
                            BuiltIn().log(f"Failed to fetch dev auth token: {e}", level="WARN")

                token = _token_cache.get(cache_key)
                if token:
                    headers['Authorization'] = f"Bearer {token}"
                    kwargs['headers'] = headers

        return super()._common_request(method, session, uri, **kwargs)
