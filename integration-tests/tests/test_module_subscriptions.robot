*** Settings ***
Library         AuthRequests
Library         Browser
Library         Collections
Library         String
Library         JSONLibrary

Suite Setup     Setup Suite
Suite Teardown  Close Browser

*** Variables ***
${BE_BASE_URL}          http://localhost:8080/v0
${FE_BASE_URL}          http://localhost:4200

*** Keywords ***
Setup Suite
    New Browser    chromium    headless=true
    New Context
    Create Session    api    ${BE_BASE_URL}

Setup Mock Login
    [Arguments]    ${user_id}
    # Mock the login state by setting localStorage manually before navigation
    # This bypasses the need to go through the actual login screen and backend dev token exchange in the FE
    New Page       ${FE_BASE_URL}
    Add Init Script    window.localStorage.setItem('agent-user-id', '${user_id}'); window.localStorage.setItem('dev-jwt-token', 'mock-token');

*** Test Cases ***

Module Access Restriction Verification
    [Documentation]    Test that a user without the 'reports_and_analysis' module cannot access it in the frontend or receive its data via sync.

    # 1. Create a test user without the module
    ${admin_headers}=   Create Dictionary    X-User-ID=2    X-User-Role=admin
    ${user_payload}=    Create Dictionary    name=No Module User    email=nomodule@example.com    role=user
    ${create_resp}=     POST On Session      api    /users    json=${user_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${create_resp.status_code}    200
    ${user_id}=         Set Variable         ${create_resp.json()['id']}

    # 2. Log in via the frontend
    Setup Mock Login    ${user_id}
    Go To               ${FE_BASE_URL}/home

    # 3. Assert that the "Reporting" navigation link is not visible in the sidebar
    Get Element States    aside >> text=Reporting    not contains    visible

    # 4. Attempt to manually navigate to the /reporting URL
    Go To               ${FE_BASE_URL}/reporting

    # Wait for potential redirect
    Sleep    2s

    # 5. Assert the route guard redirects the user back to the /home view
    ${current_url}=     Get Url
    Should Contain      ${current_url}    /home

    # 6. Verify via backend API that a sync payload for this user contains empty arrays for report data
    ${user_headers}=    Create Dictionary    X-User-ID=${user_id}
    ${sync_resp}=       GET On Session       api    /sync/pull    headers=${user_headers}
    Should Be Equal As Strings    ${sync_resp.status_code}    200
    ${farm_records_len}=    Get Length    ${sync_resp.json()['farm_records']}
    Should Be Equal As Integers    ${farm_records_len}    0
    ${soil_analyses_len}=   Get Length    ${sync_resp.json()['soil_analyses']}
    Should Be Equal As Integers    ${soil_analyses_len}    0


Module Subscription Granted Verification
    [Documentation]    Test that an admin can grant a module subscription, and the user subsequently gains access in the frontend.

    # 1. Create a test user without the module
    ${admin_headers}=   Create Dictionary    X-User-ID=2    X-User-Role=admin
    ${user_payload}=    Create Dictionary    name=Granted Module User    email=grantedmodule@example.com    role=user
    ${create_resp}=     POST On Session      api    /users    json=${user_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${create_resp.status_code}    200
    ${user_id}=         Set Variable         ${create_resp.json()['id']}

    # 2. Using an Admin API call, grant the user the 'reports_and_analysis' module
    ${modules_list}=    Create List          reports_and_analysis
    ${grant_payload}=   Create Dictionary    name=Granted Module User    email=grantedmodule@example.com    role=user    modules=${modules_list}
    ${update_resp}=     PUT On Session       api    /users/${user_id}    json=${grant_payload}    headers=${admin_headers}
    Should Be Equal As Strings    ${update_resp.status_code}    200

    # 3. Log in via the frontend
    Setup Mock Login    ${user_id}
    Go To               ${FE_BASE_URL}/home

    # 4. Assert that the "Reporting" navigation link is now visible in the sidebar
    # We must wait for RxDB to pull the user profile, which might take a moment
    Wait For Elements State    aside >> text=Reporting    visible    timeout=10s

    # 5. Click the link and assert successful navigation to the Reporting view
    Click               aside >> text=Reporting

    # Wait for navigation
    Sleep    2s

    ${current_url}=     Get Url
    Should Contain      ${current_url}    /reporting