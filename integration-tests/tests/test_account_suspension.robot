*** Settings ***
Library         AuthRequests.py
Library         Collections
Library         String

*** Variables ***
${BE_BASE_URL}          http://localhost:8080/sward

*** Test Cases ***

Account Suspension Cycle API Verification
    [Documentation]    Test that an admin can suspend a user, which blocks their API access, and then un-suspend them to restore access.

    # 1. Create a test user
    ${random_str}=    Evaluate    str(random.randint(100000, 999999))    modules=random
    &{admin_headers}=   Create Dictionary    X-User-ID=999    X-User-Role=admin
    &{user_payload}=    Create Dictionary    name=Suspension Test User    email=suspend.test.${random_str}@example.com    role=user    is_suspended=${False}
    ${create_resp}=     POST    ${BE_BASE_URL}/v0/users    json=${user_payload}    headers=${admin_headers}    expected_status=200
    ${user_id}=         Convert To String    ${create_resp.json()['id']}

    # 2. Verify successful API call as the user
    &{user_headers}=    Create Dictionary    X-User-ID=${user_id}
    ${profile_resp}=    GET    ${BE_BASE_URL}/v0/users/${user_id}    headers=${user_headers}    expected_status=200

    # 3. Use an Admin API call to update the user to is_suspended = true
    &{suspend_payload}=    Create Dictionary    name=Suspension Test User    email=suspend.test.${random_str}@example.com    role=user    is_suspended=${True}
    ${update_resp}=     PUT    ${BE_BASE_URL}/v0/users/${user_id}    json=${suspend_payload}    headers=${admin_headers}    expected_status=200

    # 4. Attempt the profile fetch again as the user and assert 403 Forbidden
    ${blocked_resp}=    GET    ${BE_BASE_URL}/v0/users/${user_id}    headers=${user_headers}    expected_status=403

    # 5. Update the user to is_suspended = false
    &{unsuspend_payload}=    Create Dictionary    name=Suspension Test User    email=suspend.test.${random_str}@example.com    role=user    is_suspended=${False}
    ${restore_resp}=    PUT    ${BE_BASE_URL}/v0/users/${user_id}    json=${unsuspend_payload}    headers=${admin_headers}    expected_status=200

    # 6. Attempt the profile fetch again and assert 200 OK
    ${restored_profile_resp}=    GET    ${BE_BASE_URL}/v0/users/${user_id}    headers=${user_headers}    expected_status=200


Suspension Data Sync Block Verification
    [Documentation]    Test that a suspended user cannot push data via the sync endpoint.

    # 1. Create a suspended test user
    ${random_str}=    Evaluate    str(random.randint(100000, 999999))    modules=random
    &{admin_headers}=   Create Dictionary    X-User-ID=999    X-User-Role=admin
    &{user_payload}=    Create Dictionary    name=Sync Block Test User    email=sync.block.${random_str}@example.com    role=user    is_suspended=${True}
    ${create_resp}=     POST    ${BE_BASE_URL}/v0/users    json=${user_payload}    headers=${admin_headers}    expected_status=200
    ${user_id}=         Convert To String    ${create_resp.json()['id']}

    # 2. Attempt to access the sync endpoint as the suspended user and assert 403 Forbidden
    &{user_headers}=    Create Dictionary    X-User-ID=${user_id}
    ${sync_resp}=       GET    ${BE_BASE_URL}/v0/sync    headers=${user_headers}    expected_status=403
