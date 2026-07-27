*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Keywords ***
# PRD Reference: 0013, 0014
Setup Multi User Environment
    [Documentation]    Creates User 1 with Farm Alpha and User 2 with Farm Beta, and an Admin User.
    ${random_str}=    Evaluate    str(random.randint(100000, 999999))    modules=random

    # User 1
    &{user1_data}=    Create Dictionary    name=User One ${random_str}    email=user1_${random_str}@example.com    role=user
    ${u1_res}=    POST    ${BE_BASE_URL}/v0/users    json=${user1_data}    expected_status=200
    ${u1_id}=    Convert To String    ${u1_res.json()['id']}

    &{headers1}=    Create Dictionary    X-User-ID=${u1_id}
    &{farm1_data}=    Create Dictionary    id=${0}    name=Farm Alpha ${random_str}    location=Alpha Loc    has_derogation=${True}
    POST    ${BE_BASE_URL}/v0/farms    json=${farm1_data}    headers=${headers1}    expected_status=200

    # User 2
    &{user2_data}=    Create Dictionary    name=User Two ${random_str}    email=user2_${random_str}@example.com    role=user
    ${u2_res}=    POST    ${BE_BASE_URL}/v0/users    json=${user2_data}    expected_status=200
    ${u2_id}=    Convert To String    ${u2_res.json()['id']}

    &{headers2}=    Create Dictionary    X-User-ID=${u2_id}
    &{farm2_data}=    Create Dictionary    id=${0}    name=Farm Beta ${random_str}    location=Beta Loc    has_derogation=${True}
    POST    ${BE_BASE_URL}/v0/farms    json=${farm2_data}    headers=${headers2}    expected_status=200

    # Admin User
    &{admin_data}=    Create Dictionary    name=Admin User ${random_str}    email=admin_${random_str}@example.com    role=admin
    ${admin_res}=    POST    ${BE_BASE_URL}/v0/users    json=${admin_data}    expected_status=200
    ${admin_id}=    Convert To String    ${admin_res.json()['id']}

    ${u1_name}=    Set Variable    User One ${random_str}
    ${u2_name}=    Set Variable    User Two ${random_str}
    ${admin_name}=    Set Variable    Admin User ${random_str}

    &{result}=    Create Dictionary    u1_id=${u1_id}    u1_name=${u1_name}    farm1_name=Farm Alpha ${random_str}    u2_id=${u2_id}    u2_name=${u2_name}    farm2_name=Farm Beta ${random_str}    admin_id=${admin_id}    admin_name=${admin_name}
    RETURN    ${result}

*** Test Cases ***
# PRD Reference: 0013, 0014
Admin and Support User Switcher and All Entity Visibility Flow
    [Documentation]    Test that an Admin/Support user sees all farms in Admin view, and can switch to individual users to view their isolated farms.
    [Teardown]    Teardown With Video

    ${env}=    Setup Multi User Environment

    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Login as Admin User
    New Page    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    css=[data-testid="user-login-${env['admin_id']}"]    visible    timeout=30s
    Click    css=[data-testid="user-login-${env['admin_id']}"]
    Wait For Elements State    css=app-home    visible    timeout=10s

    # 2. Go to Farms page and verify Admin User sees BOTH Farm Alpha and Farm Beta
    Go To    ${EXTERNAL_DNS_URL}/farms
    Sleep    3s
    Wait For Elements State    text=${env['farm1_name']}    visible    timeout=10s
    Wait For Elements State    text=${env['farm2_name']}    visible    timeout=10s

    # 3. Switch user to User 1 via login page
    Evaluate JavaScript    ${None}    () => { localStorage.clear(); }
    Go To    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    css=[data-testid="user-login-${env['u1_id']}"]    visible    timeout=10s
    Click    css=[data-testid="user-login-${env['u1_id']}"]
    Wait For Elements State    css=app-home    visible    timeout=10s
    Go To    ${EXTERNAL_DNS_URL}/farms

    # 4. Verify UI displays ONLY Farm Alpha (User 1's farm) and NOT Farm Beta
    Sleep    3s
    Wait For Elements State    text=${env['farm1_name']}    visible    timeout=10s
    Wait For Elements State    text=${env['farm2_name']}    detached    timeout=5s

    # 5. Switch user to User 2 via login page
    Evaluate JavaScript    ${None}    () => { localStorage.clear(); }
    Go To    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    css=[data-testid="user-login-${env['u2_id']}"]    visible    timeout=10s
    Click    css=[data-testid="user-login-${env['u2_id']}"]
    Wait For Elements State    css=app-home    visible    timeout=10s
    Go To    ${EXTERNAL_DNS_URL}/farms

    # 6. Verify UI displays ONLY Farm Beta (User 2's farm) and NOT Farm Alpha
    Sleep    3s
    Wait For Elements State    text=${env['farm2_name']}    visible    timeout=10s
    Wait For Elements State    text=${env['farm1_name']}    detached    timeout=5s

    # 7. Switch back to Admin User via login page
    Evaluate JavaScript    ${None}    () => { localStorage.clear(); }
    Go To    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    css=[data-testid="user-login-${env['admin_id']}"]    visible    timeout=10s
    Click    css=[data-testid="user-login-${env['admin_id']}"]
    Wait For Elements State    css=app-home    visible    timeout=10s
    Go To    ${EXTERNAL_DNS_URL}/farms

    # 8. Verify Admin view displays BOTH Farm Alpha and Farm Beta again
    Sleep    3s
    Wait For Elements State    text=${env['farm1_name']}    visible    timeout=10s
    Wait For Elements State    text=${env['farm2_name']}    visible    timeout=10s

    # 9. Clean up created entities via API
    &{h1}=    Create Dictionary    X-User-ID=${env['u1_id']}
    ${farms1}=    GET    ${BE_BASE_URL}/v0/farms    headers=${h1}    expected_status=200
    FOR    ${farm}    IN    @{farms1.json()}
        Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/farms/${farm['id']}    headers=${h1}    expected_status=204
    END
    Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/users/${env['u1_id']}    expected_status=204

    &{h2}=    Create Dictionary    X-User-ID=${env['u2_id']}
    ${farms2}=    GET    ${BE_BASE_URL}/v0/farms    headers=${h2}    expected_status=200
    FOR    ${farm}    IN    @{farms2.json()}
        Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/farms/${farm['id']}    headers=${h2}    expected_status=204
    END
    Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/users/${env['u2_id']}    expected_status=204

    Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/users/${env['admin_id']}    expected_status=204
