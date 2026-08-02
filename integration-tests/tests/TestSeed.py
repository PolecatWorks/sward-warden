import requests
from robot.libraries.BuiltIn import BuiltIn

class TestSeed:
    """
    Custom Robot Framework Python library for seeding test data via REST APIs
    before running integration test suites.
    """
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def seed_test_database(self, user_id=1):
        """
        Idempotently seeds baseline users, farms, fields, and events
        via the backend REST API endpoints using admin credentials.
        """
        be_base_url = BuiltIn().get_variable_value("${BE_BASE_URL}") or "http://localhost:8080/sward"
        clean_base = be_base_url.rstrip('/')
        if not clean_base.endswith('/sward'):
            clean_base = f"{clean_base}/sward"

        admin_token = None
        try:
            tok_r = requests.post(f"{clean_base}/dev/auth/token", json={"user_id": 999, "role": "admin"}, timeout=5)
            if tok_r.status_code == 200:
                admin_token = tok_r.json().get("access_token")
        except Exception:
            pass

        admin_headers = {}
        if admin_token:
            admin_headers["Authorization"] = f"Bearer {admin_token}"
        else:
            admin_headers = {'X-User-ID': '999', 'X-User-Role': 'admin'}

        user_id_int = int(user_id) if str(user_id).isdigit() else 1

        # 1. Ensure target user (Demo User 1) exists
        user_payload = {"id": user_id_int, "name": "Demo User", "email": f"user{user_id_int}@example.com", "role": "user"}
        try:
            r = requests.get(f"{clean_base}/v0/users/{user_id_int}", headers=admin_headers, timeout=5)
            if r.status_code != 200:
                requests.post(f"{clean_base}/v0/users", json=user_payload, headers=admin_headers, timeout=5)
        except Exception as e:
            BuiltIn().log(f"TestSeed: User creation check failed: {e}", level="WARN")

        # 2. Ensure Admin User 999 exists
        admin_payload = {"id": 999, "name": "Demo Admin", "email": "admin@example.com", "role": "admin"}
        try:
            r = requests.get(f"{clean_base}/v0/users/999", headers=admin_headers, timeout=5)
            if r.status_code != 200:
                requests.post(f"{clean_base}/v0/users", json=admin_payload, headers=admin_headers, timeout=5)
        except Exception as e:
            BuiltIn().log(f"TestSeed: Admin user creation check failed: {e}", level="WARN")

        # 3. Check existing farms for user_id_int
        try:
            farms_r = requests.get(f"{clean_base}/v0/farms", headers=admin_headers, timeout=5)
            if farms_r.status_code == 200:
                user_farms = [f for f in farms_r.json() if f.get('user_id') == user_id_int]
                if len(user_farms) >= 3:
                    BuiltIn().log("TestSeed: Base farms already seeded.", level="INFO")
                    return
        except Exception as e:
            BuiltIn().log(f"TestSeed: Farm listing check failed: {e}", level="WARN")

        # 4. Seed baseline farms, fields, and events if missing
        counties = ["Down", "Antrim", "Tyrone"]
        for i in range(1, 4):
            farm_name = f"Farm {i}"
            location = f"County {counties[i-1]}, NI"
            farm_payload = {"id": 0, "user_id": user_id_int, "name": farm_name, "location": location, "has_derogation": False}

            try:
                farm_resp = requests.post(f"{clean_base}/v0/farms", json=farm_payload, headers=admin_headers, timeout=5)
                if farm_resp.status_code in (200, 201):
                    farm_id = farm_resp.json().get('id')
                    for j in range(1, 6):
                        field_name = f"Field {i}-{j}"
                        area = 2.5 + (j * 1.2)
                        field_payload = {"id": 0, "farm_id": farm_id, "name": field_name, "area_hectares": area, "land_use": "grassland"}
                        field_resp = requests.post(f"{clean_base}/v0/fields", json=field_payload, headers=admin_headers, timeout=5)
                        if field_resp.status_code in (200, 201):
                            field_id = field_resp.json().get('id')
                            for k in range(1, 11):
                                event_type = "planned" if k % 3 == 0 else "completed"
                                desc = f"Slurry application #{k} - {k * 50}m3 applied"
                                event_payload = {"id": 0, "field_id": field_id, "event_type": event_type, "description": desc, "date": f"2024-05-{k+10:02d}"}
                                requests.post(f"{clean_base}/v0/events", json=event_payload, headers=admin_headers, timeout=5)
            except Exception as e:
                BuiltIn().log(f"TestSeed: Seeding loop failed for farm {i}: {e}", level="WARN")

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080/sward"
    seeder = TestSeed()
    seeder.seed_test_database()
