*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
# No obvious PRD requirement
Verify REST Fallback and Warning Banner on Database Failure
    [Documentation]    Test that the application falls back to REST-only mode and displays a warning banner when database initialization persistently fails.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    Login As Demo User

    # 1. Load the application with the mock persistent failure query parameter
    Go To    ${EXTERNAL_DNS_URL}/home?mock-db-fail-persistent=true

    # 2. Verify that the REST fallback warning banner is displayed in the UI shell
    Wait For Elements State    \#fallback-warning-banner    visible    timeout=10s
    Get Text    \#fallback-warning-banner    contains    Offline support is temporarily unavailable due to a local storage error.

    # 3. Navigate to the Farms view (maintaining the query parameter to keep the database failure mocked)
    Go To    ${EXTERNAL_DNS_URL}/farms?mock-db-fail-persistent=true
    Sleep    2s

    # 4. Generate a unique farm name
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    Fallback E2E Farm ${random_str}
    ${farm_location}=    Set Variable    Fallback E2E Location

    # 5. Click Add Farm button and fill details
    Click    \#add-farm-fab    button=left
    Fill Text    \#farm-name-input    ${farm_name}
    Fill Text    \#farm-location-input    ${farm_location}
    Click    \#save-farm-btn    button=left

    # 6. Wait for the add farm modal to close
    Wait For Elements State    \#save-farm-btn    detached    timeout=5s

    # 7. Verify the farm card appears in the UI list
    Wait For Elements State    div[data-testid^="farm-card-"] h3 >> text=${farm_name}    visible    timeout=10s

    # 8. Verify the farm was written directly to the backend API (since local caching is bypassed)
    ${list_response}=    GET    ${BE_BASE_URL}/v0/farms    expected_status=200
    Log    Farms list response is: ${list_response.content}
    ${farms}=    Set Variable    ${list_response.json()}

    ${found_farm}=    Set Variable    ${False}
    ${farm_id}=    Set Variable    ${EMPTY}
    FOR    ${farm}    IN    @{farms}
        IF    '${farm['name']}' == '${farm_name}'
            ${found_farm}=    Set Variable    ${True}
            ${farm_id}=    Set Variable    ${farm['id']}
            BREAK
        END
    END
    Should Be True    ${found_farm}    Farm was not written directly to the backend API during REST fallback mode

    # 9. Clean up: Delete the farm via the UI
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_id}?mock-db-fail-persistent=true
    Wait For Elements State    id=farm-name-heading    visible    timeout=5s
    Click    button[data-testid="delete-farm-btn"]    button=left
    Wait For Elements State    id=delete-confirm-panel    visible    timeout=5s
    Click    button[data-testid="confirm-delete-farm-btn"]    button=left
    Wait For Elements State    text=${farm_name}    detached    timeout=10s
