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
    Login As Demo User
    Go To    ${EXTERNAL_DNS_URL}/farms

    # Wait for sync/loading
    Sleep    2s

    # Generate a unique farm name
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    E2E Test Farm ${random_str}
    ${farm_location}=    Set Variable    E2E Test Location

    # 1. Click Add Farm FAB using UI
    Click With Options    \#add-farm-fab    button=left    force=${True}

    # 2. Fill farm details in Modal
    Fill Text    \#farm-name-input    ${farm_name}
    Fill Text    \#farm-location-input    ${farm_location}
    Click With Options    \#save-farm-btn    button=left    force=${True}

    # Wait for the add farm modal to close
    Wait For Elements State    \#save-farm-btn    detached    timeout=5s

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

    # 5. Navigate to the farm detail view page
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_id}
    Wait For Elements State    id=farm-name-heading    visible    timeout=5s

    # 6. Click Delete Farm button to reveal confirmation panel
    Click With Options    button[data-testid="delete-farm-btn"]    button=left    force=${True}
    Wait For Elements State    id=delete-confirm-panel    visible    timeout=5s

    # 7. Click Confirm Delete
    Click With Options    button[data-testid="confirm-delete-farm-btn"]    button=left    force=${True}

    # 8. Confirm deleted in UI (wait until text is not present)
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

Farm Deletion Blocking and Field Migration Flow
    [Documentation]    Test that farm deletion is blocked if there are active fields, then migrate the field and delete
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    Login As Demo User

    # 1. Create Farm A and Farm B via API
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_a_name}=    Set Variable    Safe Delete Farm A ${random_str}
    ${farm_b_name}=    Set Variable    Safe Delete Farm B ${random_str}

    &{farm_a_data}=    Create Dictionary    id=${0}    name=${farm_a_name}    location=Location A    has_derogation=${True}
    ${farm_a_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_a_data}    expected_status=200
    ${farm_a_id_int}=    Set Variable    ${farm_a_response.json()['id']}
    ${farm_a_id}=    Convert To String    ${farm_a_id_int}

    &{farm_b_data}=    Create Dictionary    id=${0}    name=${farm_b_name}    location=Location B    has_derogation=${True}
    ${farm_b_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_b_data}    expected_status=200
    ${farm_b_id_int}=    Set Variable    ${farm_b_response.json()['id']}
    ${farm_b_id}=    Convert To String    ${farm_b_id_int}

    # 2. Create Field 1 in Farm A via API
    ${field_name}=    Set Variable    Migration Field ${random_str}
    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_a_id_int}    name=${field_name}    area_hectares=${10.0}    land_use=grassland
    ${field_response}=    POST    ${BE_BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id}=    Convert To String    ${field_response.json()['id']}

    # Wait for sync
    Sleep    5s

    # 3. Go to Farm A Details page
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_a_id}
    Wait For Elements State    id=farm-name-heading    visible    timeout=5s

    # 4. Verify Delete Farm button is disabled and warning is present
    Wait For Elements State    id=delete-farm-warning    visible    timeout=5s
    Get Element States    id=delete-farm-btn    contains    disabled

    # 5. Go to Field details page
    Go To    ${EXTERNAL_DNS_URL}/fields/${field_id}
    Wait For Elements State    text=${field_name}    visible    timeout=5s

    # 6. Click Edit Field and select Farm B
    Click With Options    \#edit-field-btn    button=left    force=${True}
    Wait For Elements State    id=edit-field-modal    visible    timeout=5s

    # Select Farm B from dropdown
    Select Options By    id=edit-field-farm-input    value    ${farm_b_id}
    Click With Options    \#save-edit-field-btn    button=left    force=${True}
    Wait For Elements State    id=edit-field-modal    detached    timeout=5s

    # Wait for sync
    Sleep    5s

    # 7. Go to Farm A Details page again
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_a_id}
    Wait For Elements State    id=farm-name-heading    visible    timeout=5s

    # 8. Verify Delete Farm button is now enabled and warning is gone
    Wait For Elements State    id=delete-farm-warning    detached    timeout=5s
    Get Element States    id=delete-farm-btn    not contains    disabled

    # 9. Click Delete Farm, Confirm
    Click With Options    button[data-testid="delete-farm-btn"]    button=left    force=${True}
    Wait For Elements State    id=delete-confirm-panel    visible    timeout=5s
    Click With Options    button[data-testid="confirm-delete-farm-btn"]    button=left    force=${True}

    # 10. Verify Farm A is deleted
    Wait For Elements State    text=${farm_a_name}    detached    timeout=10s

    # Clean up Farm B and Field 1 via API
    DELETE    ${BE_BASE_URL}/v0/fields/${field_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_b_id}    expected_status=204
