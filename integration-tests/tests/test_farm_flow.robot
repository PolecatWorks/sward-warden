*** Settings ***
Library    Browser
Library    RequestsLibrary
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Farm Creation and Deletion Flow
    [Documentation]    Test farm creation and deletion flow end-to-end
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    New Page    ${EXTERNAL_DNS_URL}/farms

    # Wait for sync/loading
    Sleep    2s

    # Generate a unique farm name
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    E2E Test Farm ${random_str}
    ${farm_location}=    Set Variable    E2E Test Location

    # 1. Click Add Farm FAB using UI
    Click    \#add-farm-fab    button=left    force=${True}

    # 2. Fill farm details in Modal
    Fill Text    \#farm-name-input    ${farm_name}
    Fill Text    \#farm-location-input    ${farm_location}
    Click    \#save-farm-btn    button=left    force=${True}

    # 3. View the created farm in UI
    # Since it is dynamically added, wait a bit or look for it
    Wait For Elements State    text=${farm_name}    visible    timeout=10s

    # Wait for sync
    Sleep    5s

    # 4. Check farm exists via API
    ${list_response}=    GET    ${BE_BASE_URL}/v0/farms    expected_status=200
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
    Should Be True    ${found_farm}    Farm not found in API response

    # 5. Delete farm using UI
    Click    button[data-testid="delete-farm-${farm_id}"]    button=left    force=${True}

    # 6. Confirm deleted in UI (wait until text is not present)
    Wait For Elements State    text=${farm_name}    detached    timeout=10s

    # Wait for sync
    Sleep    5s

    # 7. Confirm deleted via API
    ${list_response_after}=    GET    ${BE_BASE_URL}/v0/farms    expected_status=200
    ${farms_after}=    Set Variable    ${list_response_after.json()}

    ${found_farm_after}=    Set Variable    ${False}
    FOR    ${farm}    IN    @{farms_after}
        IF    '${farm['name']}' == '${farm_name}'
            ${found_farm_after}=    Set Variable    ${True}
            BREAK
        END
    END
    Should Not Be True    ${found_farm_after}    Farm still found in API response after deletion
