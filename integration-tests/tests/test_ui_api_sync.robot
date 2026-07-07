*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
# PRD Reference: 0014
UI and API Sync Journey
    [Documentation]    Test end-to-end sync between UI and API for creating and deleting farms and fields
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Login to UI
    Login As Demo User

    # 2. Use UI to create a farm
    Go To    ${EXTERNAL_DNS_URL}/farms
    Sleep    2s

    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    Sync Test Farm ${random_str}
    ${farm_location}=    Set Variable    Sync Location

    Click    \#add-farm-fab    button=left
    Fill Text    \#farm-name-input    ${farm_name}
    Fill Text    \#farm-location-input    ${farm_location}
    Click    \#save-farm-btn    button=left

    Wait For Elements State    \#save-farm-btn    detached    timeout=5s

    # 3. Confirm farm exists via UI
    Wait For Elements State    text=${farm_name}    visible    timeout=10s
    Sleep    5s

    # Get farm ID from backend API
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

    # 4. Use UI to create a field
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_id}/fields
    Sleep    2s

    ${field_name}=    Set Variable    Sync Test Field ${random_str}

    Click    button >> text=Add Field    button=left
    Fill Text    \#newFieldName    ${field_name}
    Fill Text    \#newFieldArea    10.5
    Click    button >> text=Save Field    button=left

    # 5. Confirm field exists via UI
    Wait For Elements State    text=${field_name}    visible    timeout=10s
    Sleep    5s

    # 6. Confirm field exists via API
    ${fields_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${fields_response.json()}

    ${found_field}=    Set Variable    ${False}
    ${field_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    '${field['name']}' == '${field_name}' and '${field['farm_id']}' == '${farm_id}'
            ${found_field}=    Set Variable    ${True}
            ${field_id}=    Set Variable    ${field['id']}
            BREAK
        END
    END
    Should Be True    ${found_field}    Field not found in API response

    # 7. Delete field via API
    DELETE    ${BE_BASE_URL}/v0/fields/${field_id}    expected_status=204

    # 8. Force sync in UI and confirm field is removed
    Reload
    Sleep    5s
    Wait For Elements State    text=${field_name}    detached    timeout=10s

    # 9. Delete farm via API
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=204

    # 10. Force sync in UI and confirm farm is removed
    Go To    ${EXTERNAL_DNS_URL}/farms
    Reload
    Sleep    5s
    Wait For Elements State    text=${farm_name}    detached    timeout=10s

    # 11. Create a new farm via API
    ${new_farm_name}=    Set Variable    New API Farm ${random_str}
    &{new_farm_data}=    Create Dictionary    id=${0}    name=${new_farm_name}    location=New Location    has_derogation=${True}
    ${new_farm_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${new_farm_data}    expected_status=200
    ${new_farm_id}=    Convert To String    ${new_farm_response.json()['id']}

    # 12. Confirm new farm is visible in UI
    Reload
    Sleep    5s
    Wait For Elements State    text=${new_farm_name}    visible    timeout=10s

    # 13. Create a new field via API
    ${new_field_name}=    Set Variable    New API Field ${random_str}
    &{new_field_data}=    Create Dictionary    id=${0}    farm_id=${new_farm_response.json()['id']}    name=${new_field_name}    area_hectares=${12.5}    land_use=grassland
    ${new_field_response}=    POST    ${BE_BASE_URL}/v0/fields    json=${new_field_data}    expected_status=200
    ${new_field_id}=    Convert To String    ${new_field_response.json()['id']}

    # 14. Confirm new field is visible in UI
    Go To    ${EXTERNAL_DNS_URL}/farms/${new_farm_id}/fields
    Reload
    Sleep    5s
    Wait For Elements State    text=${new_field_name}    visible    timeout=10s

    # Cleanup via API
    DELETE    ${BE_BASE_URL}/v0/fields/${new_field_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${new_farm_id}    expected_status=204
