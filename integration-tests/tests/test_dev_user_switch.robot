*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Keywords ***
# PRD Reference: 0014
Setup User And Farm
    [Documentation]    Finds or creates a base user and creates exactly one Farm 1 for them.
    ${users_res}=    GET    ${BE_BASE_URL}/v0/users    expected_status=200
    ${users}=    Set Variable    ${users_res.json()}
    ${users_len}=    Get Length    ${users}
    IF    ${users_len} == 0
        &{user_data}=    Create Dictionary    name=Demo User    email=user1@example.com    role=user
        ${user_res}=    POST    ${BE_BASE_URL}/v0/users    json=${user_data}    expected_status=200
        ${user_id}=    Convert To String    ${user_res.json()['id']}
    ELSE
        ${user_id}=    Convert To String    ${users[0]['id']}
    END

    # Clean up any existing Farm 1 for this user to prevent strict mode violations
    &{headers}=    Create Dictionary    X-User-ID=${user_id}
    ${farms_res}=    GET    ${BE_BASE_URL}/v0/farms    headers=${headers}    expected_status=200
    ${farms}=    Set Variable    ${farms_res.json()}
    FOR    ${farm}    IN    @{farms}
        IF    '${farm['name']}' == 'Farm 1'
            Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/farms/${farm['id']}    headers=${headers}    expected_status=204
        END
    END

    # Create exactly one Farm 1
    &{farm_data}=    Create Dictionary    id=${0}    name=Farm 1    location=Test Location    has_derogation=${True}
    POST    ${BE_BASE_URL}/v0/farms    json=${farm_data}    headers=${headers}    expected_status=200

    RETURN    ${user_id}

*** Test Cases ***
# PRD Reference: 0014
Dev User Switching Flow
    [Documentation]    Test that we can login as one user, switch to another, and see different farms.
    [Teardown]    Teardown With Video

    ${user_id}=    Setup User And Farm

    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # Generate a unique username and email to prevent DB key duplicate errors (422)
    ${random_str}=    Evaluate    str(random.randint(100000, 999999))    modules=random
    ${user_name}=     Set Variable    Robot User ${random_str}
    ${user_email}=    Set Variable    robot_${random_str}@example.com

    # 1. Register a new user via UI to guarantee we have a second user
    New Page    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    xpath=//button[contains(., "Create New User")]    visible    timeout=10s
    Click    xpath=//button[contains(., "Create New User")]
    Wait For Elements State    id=new-name    visible    timeout=5s
    Fill Text    id=new-name    ${user_name}
    Fill Text    id=new-email    ${user_email}
    Click    xpath=//button[contains(., "Save and Register User")]
    Wait For Elements State    text=${user_name}    visible    timeout=10s

    # 2. Login as Demo User
    Click    css=[data-testid="user-login-${user_id}"]
    Wait For Elements State    css=app-home    visible    timeout=10s

    # 3. Go to Farms page and verify Demo User's farms are visible
    Go To    ${EXTERNAL_DNS_URL}/farms
    Sleep    3s
    Wait For Elements State    text=Farm 1    visible    timeout=10s

    # 4. Switch user to Robot Test User using Header User Switcher dropdown
    Run Keyword And Ignore Error    Select Options By    id=user-switcher-dropdown    text    ${user_name} (user)

    # 5. Verify page reloaded and we see "No farms yet" empty state since Robot Test User has no farms
    Sleep    3s
    Wait For Elements State    text=No farms yet    visible    timeout=10s
    Wait For Elements State    text=Farm 1    detached    timeout=5s

    # 6. Switch back to Demo User via dropdown using value=${user_id}
    Run Keyword And Ignore Error    Select Options By    id=user-switcher-dropdown    value    ${user_id}

    # 7. Verify we see Demo User's Farm 1 again
    Sleep    3s
    Wait For Elements State    text=Farm 1    visible    timeout=10s
    Wait For Elements State    text=No farms yet    detached    timeout=5s

# PRD Reference: 0014
Verify Force Sync With User Change In Between
    [Documentation]    Test that if the user changes in between syncs (simulated by localStorage changes),
    ...                clicking the refresh/sync button invalidates the old sync point and refreshes all.
    [Teardown]    Teardown With Video

    ${user_id}=    Setup User And Farm

    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Login as Demo User
    New Page    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    css=[data-testid="user-login-${user_id}"]    visible    timeout=10s
    Click    css=[data-testid="user-login-${user_id}"]
    Wait For Elements State    css=app-home    visible    timeout=10s

    # 2. Go to Farms page and see Demo User's farms
    Go To    ${EXTERNAL_DNS_URL}/farms
    Sleep    3s
    Wait For Elements State    text=Farm 1    visible    timeout=10s

    # 3. Register "Clean Sync User" via API with a unique email to ensure we have a user with 0 farms
    ${random_str}=    Evaluate    [str(random.randint(100000, 999999))]    modules=random
    ${random_str}=    Set Variable    ${random_str[0]}
    ${clean_email}=   Set Variable    cleansync_${random_str}@example.com
    ${clean_user_json}=    Create Dictionary    id=${0}    name=Clean Sync User    email=${clean_email}    role=user
    ${user_res}=    POST    ${BE_BASE_URL}/v0/users    json=${clean_user_json}    expected_status=200
    ${clean_user_id}=    Set Variable    ${user_res.json()['id']}

    # 4. Get JWT token for Clean Sync User
    ${token_req}=    Create Dictionary    user_id=${clean_user_id}    role=user
    ${clean_auth_res}=    POST    ${BE_BASE_URL}/dev/auth/token    json=${token_req}    expected_status=200
    ${clean_token}=    Set Variable    ${clean_auth_res.json()['access_token']}

    # 5. Simulate a user change in between by updating localStorage manually without page reload
    Evaluate JavaScript    ${None}    () => localStorage.setItem('agent-user-id', '${clean_user_id}')
    Evaluate JavaScript    ${None}    () => localStorage.setItem('dev-jwt-token', '${clean_token}')

    # 6. Click the sync status refresh/force sync button
    Wait For Elements State    css=[data-testid^="sync-status-"]    visible    timeout=10s
    Run Keyword And Ignore Error    Click    css=[data-testid^="sync-status-"]

    # 7. Verify that the dataset has been refreshed to Clean Sync User
    # (Clean Sync User has 0 farms, so Farm 1 should disappear and "No farms yet" should appear)
    Sleep    3s
    Wait For Elements State    text=No farms yet    visible    timeout=10s
    Wait For Elements State    text=Farm 1    detached    timeout=5s
