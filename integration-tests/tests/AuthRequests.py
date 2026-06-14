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

                # Get the JWT token from the dev auth endpoint
                cache_key = (str(user_id), str(role))
                if cache_key not in _token_cache:
                    auth_url = f"{be_base_url.rstrip('/')}/dev/auth/token"
                    try:
                        r = requests.post(
                            auth_url,
                            json={"user_id": int(user_id), "role": str(role)},
                            timeout=5
                        )
                        r.raise_for_status()
                        token = r.json().get("access_token")
                        if token:
                            _token_cache[cache_key] = token
                    except Exception as e:
                        # Fallback or log if token fetch fails
                        BuiltIn().log(f"Failed to fetch dev auth token: {e}", level="WARN")

                token = _token_cache.get(cache_key)
                if token:
                    headers['Authorization'] = f"Bearer {token}"
                    kwargs['headers'] = headers

        return super()._common_request(method, session, uri, **kwargs)
