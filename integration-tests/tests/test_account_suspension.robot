*** Settings ***
Library         AuthRequests
Library         Collections
Library         String
Library         JSONLibrary

Suite Setup     Create Session    api    ${BE_BASE_URL}

*** Variables ***
${BE_BASE_URL}          http://localhost:8080/v0

*** Test Cases ***

Account Suspension Cycle API Verification
    [Documentation]    Test that an admin can suspend a user, which blocks their API access, and then un-suspend them to restore access.

    # 1. Create a test user
    ${admin_headers}=   Create Dictionary    X-User-ID=2    X-User-Role=admin
    ${user_payload}=    Create Dictionary    name=Suspension Test User    email=suspend.test@example.com    role=user
    ${create_resp}=     POST On Session      api    /users    json=${user_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${create_resp.status_code}    200
    ${user_id}=         Set Variable         ${create_resp.json()['id']}

    # 2. Verify successful API call as the user
    ${user_headers}=    Create Dictionary    X-User-ID=${user_id}
    ${profile_resp}=    GET On Session       api    /users/${user_id}    headers=${user_headers}
    Should Be Equal As Strings    ${profile_resp.status_code}    200

    # 3. Use an Admin API call to update the user to is_suspended = true
    ${suspend_payload}=    Create Dictionary    name=Suspension Test User    email=suspend.test@example.com    role=user    is_suspended=${True}
    ${update_resp}=     PUT On Session       api    /users/${user_id}    json=${suspend_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${update_resp.status_code}    200

    # 4. Attempt the profile fetch again as the user and assert 403 Forbidden
    ${blocked_resp}=    GET On Session       api    /users/${user_id}    headers=${user_headers}    expected_status=403
    Should Be Equal As Strings    ${blocked_resp.status_code}    403

    # 5. Update the user to is_suspended = false
    ${unsuspend_payload}=    Create Dictionary    name=Suspension Test User    email=suspend.test@example.com    role=user    is_suspended=${False}
    ${restore_resp}=    PUT On Session       api    /users/${user_id}    json=${unsuspend_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${restore_resp.status_code}    200

    # 6. Attempt the profile fetch again and assert 200 OK
    ${restored_profile_resp}=    GET On Session       api    /users/${user_id}    headers=${user_headers}
    Should Be Equal As Strings    ${restored_profile_resp.status_code}    200


Suspension Data Sync Block Verification
    [Documentation]    Test that a suspended user cannot push data via the sync endpoint.

    # 1. Create a suspended test user
    ${admin_headers}=   Create Dictionary    X-User-ID=2    X-User-Role=admin
    ${user_payload}=    Create Dictionary    name=Sync Block Test User    email=sync.block@example.com    role=user    is_suspended=${True}
    ${create_resp}=     POST On Session      api    /users    json=${user_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${create_resp.status_code}    200
    ${user_id}=         Set Variable         ${create_resp.json()['id']}

    # 2. Attempt to send an outbox mutation payload
    ${user_headers}=    Create Dictionary    X-User-ID=${user_id}
    ${mutations}=       Create List
    ${sync_payload}=    Create Dictionary    mutations=${mutations}
    ${sync_resp}=       POST On Session      api    /sync/push    json=${sync_payload}    headers=${user_headers}    expected_status=403
    Should Be Equal As Strings    ${sync_resp.status_code}    403