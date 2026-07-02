*** Settings ***
Library         AuthRequests.py
Library         Browser
Library         Collections
Library         String

Suite Setup     Setup Suite
Suite Teardown  Close Browser

*** Variables ***
${BE_BASE_URL}          http://localhost:8080/sward
${FE_BASE_URL}          http://localhost:4200

*** Keywords ***
Setup Suite
    New Browser    chromium    headless=true
    New Context

Setup UI Login
    [Arguments]    ${user_id}
    New Page       ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    css=[data-testid="user-login-${user_id}"]    visible    timeout=15s
    Click          css=[data-testid="user-login-${user_id}"]
    Wait For Elements State    css=app-home    visible    timeout=15s

*** Test Cases ***

Module Access Restriction Verification
    [Documentation]    Test that a user without the 'reports_and_analysis' module cannot access it in the frontend or receive its data via sync.

    # 1. Create a test user without the module
    ${random_str}=    Evaluate    str(random.randint(100000, 999999))    modules=random
    &{admin_headers}=   Create Dictionary    X-User-ID=2    X-User-Role=admin
    &{user_payload}=    Create Dictionary    name=No Module User    email=nomodule.${random_str}@example.com    role=user    is_suspended=${False}
    ${create_resp}=     POST    ${BE_BASE_URL}/v0/users    json=${user_payload}    headers=${admin_headers}    expected_status=200
    ${user_id}=         Convert To String    ${create_resp.json()['id']}

    # 2. Log in via the frontend
    Setup UI Login    ${user_id}

    # 3. Assert that the "Reporting" navigation link is not visible in the sidebar
    Get Element States    aside >> text=Reporting    not contains    visible

    # 4. Attempt to manually navigate to the /reporting URL
    Go To               ${EXTERNAL_DNS_URL}/reporting

    # Wait for potential redirect
    Sleep    2s

    # 5. Assert the route guard redirects the user back to the /home view
    ${current_url}=     Get Url
    Should Contain      ${current_url}    /home

    # 6. Verify via backend API that a sync payload for this user contains empty arrays for report data
    &{user_headers}=    Create Dictionary    X-User-ID=${user_id}
    ${sync_resp}=       GET    ${BE_BASE_URL}/v0/sync    headers=${user_headers}    expected_status=200
    ${farm_records_len}=    Get Length    ${sync_resp.json()['farm_records']}
    Should Be Equal As Integers    ${farm_records_len}    0
    ${soil_analyses_len}=   Get Length    ${sync_resp.json()['soil_analyses']}
    Should Be Equal As Integers    ${soil_analyses_len}    0


Module Subscription Granted Verification
    [Documentation]    Test that an admin can grant a module subscription, and the user subsequently gains access in the frontend.

    # 1. Create a test user without the module
    ${random_str}=    Evaluate    str(random.randint(100000, 999999))    modules=random
    &{admin_headers}=   Create Dictionary    X-User-ID=2    X-User-Role=admin
    &{user_payload}=    Create Dictionary    name=Granted Module User    email=grantedmodule.${random_str}@example.com    role=user    is_suspended=${False}
    ${create_resp}=     POST    ${BE_BASE_URL}/v0/users    json=${user_payload}    headers=${admin_headers}    expected_status=200
    ${user_id}=         Convert To String    ${create_resp.json()['id']}

    # 2. Using an Admin API call, grant the user the 'reports_and_analysis' module
    ${modules_list}=    Create List          reports_and_analysis
    &{grant_payload}=   Create Dictionary    name=Granted Module User    email=grantedmodule.${random_str}@example.com    role=user    modules=${modules_list}    is_suspended=${False}
    ${update_resp}=     PUT    ${BE_BASE_URL}/v0/users/${user_id}    json=${grant_payload}    headers=${admin_headers}    expected_status=200

    # 3. Log in via the frontend
    Setup UI Login    ${user_id}
    Sleep    3s

    # 4. Assert that the "Reporting" navigation link is now visible in the sidebar
    # We must wait for RxDB to pull the user profile, which might take a moment
    Wait For Elements State    aside >> text=Reporting    visible    timeout=20s

    # 5. Click the link and assert successful navigation to the Reporting view
    Click               aside >> text=Reporting

    # Wait for navigation
    Sleep    2s

    ${current_url}=     Get Url
    Should Contain      ${current_url}    /reporting
