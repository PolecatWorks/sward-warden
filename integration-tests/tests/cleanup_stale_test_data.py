import requests

def cleanup_stale_test_data(be_base_url="http://localhost:8080/sward", auth_token=None):
    """
    Sweeps the backend API for test entities (farms/users/fields created during test runs)
    and cleans them up via the backend DELETE endpoints.
    """
    be_base_url = be_base_url.rstrip("/")
    if not auth_token:
        try:
            r = requests.post(f"{be_base_url}/dev/auth/token", json={"user_id": 1, "role": "admin"}, timeout=5)
            if r.status_code == 200:
                auth_token = r.json().get("access_token")
        except Exception as e:
            print(f"Could not fetch dev token: {e}")

    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    print(f"Sweeping for stale test data at {be_base_url}...")

    # 1. Fetch farms
    try:
        r = requests.get(f"{be_base_url}/v0/farms", headers=headers, timeout=5)
        if r.status_code == 200:
            farms = r.json()
            for farm in farms:
                farm_id = farm.get("id")
                farm_name = farm.get("name", "")
                if farm_name.startswith("Test ") or "robot" in farm_name.lower() or "temp" in farm_name.lower():
                    print(f"Deleting test farm ID {farm_id} ('{farm_name}')...")
                    del_r = requests.delete(f"{be_base_url}/v0/farms/{farm_id}", headers=headers, timeout=5)
                    if del_r.status_code in (200, 204):
                        print(f"Successfully deleted farm {farm_id}")
                    else:
                        print(f"Failed to delete farm {farm_id}: status {del_r.status_code}")
    except Exception as e:
        print(f"Error checking/deleting farms: {e}")

    # 2. Fetch users
    try:
        r = requests.get(f"{be_base_url}/v0/users", headers=headers, timeout=5)
        if r.status_code == 200:
            users = r.json()
            for user in users:
                user_id = user.get("id")
                user_email = user.get("email", "")
                user_name = user.get("name", "")
                if (user_email.startswith("test_") or "robot" in user_email.lower() or
                    user_name.startswith("Test ") or "robot" in user_name.lower()):
                    print(f"Deleting test user ID {user_id} ('{user_email}')...")
                    del_r = requests.delete(f"{be_base_url}/v0/users/{user_id}", headers=headers, timeout=5)
                    if del_r.status_code in (200, 204):
                        print(f"Successfully deleted user {user_id}")
                    else:
                        print(f"Failed to delete user {user_id}: status {del_r.status_code}")
    except Exception as e:
        print(f"Error checking/deleting users: {e}")

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080/sward"
    cleanup_stale_test_data(url)
