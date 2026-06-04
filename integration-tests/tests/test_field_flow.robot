*** Settings ***
Library    Browser
Library    RequestsLibrary
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Field Creation and Deletion Flow
    [Documentation]    Test field creation and deletion flow end-to-end within a specific farm.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Create a Farm via API to act as parent
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    E2E Parent Farm ${random_str}
    &{farm_data}=    Create Dictionary    id=${0}    name=${farm_name}    location=E2E Location    has_derogation=${True}
    ${farm_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id}=    Convert To String    ${farm_response.json()['id']}

    # 2. Navigate to the created farm's fields page
    New Page    ${EXTERNAL_DNS_URL}/farms/${farm_id}/fields

    # Wait for sync/loading
    Sleep    2s

    # Generate unique field data
    ${field_name}=    Set Variable    E2E Test Field ${random_str}
    ${field_area}=    Set Variable    15.5

    # 3. Click "Add Field"
    Click    button >> text=Add Field

    # 4. Fill in field details and save
    Fill Text    \#newFieldName    ${field_name}
    Fill Text    \#newFieldArea    ${field_area}
    Click    button >> text=Save Field

    # 5. Wait for field to appear in the UI
    Wait For Elements State    text=${field_name}    visible    timeout=10s

    # Wait for sync
    Sleep    5s

    # 6. Verify creation via API
    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}

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

    # 7. Delete field via UI
    # Re-evaluating the locator for delete button to avoid xpath complexity.
    # We look for the delete button matching the specific field ID.
    Click    button[aria-label="Delete ${field_name}"]

    # 8. Confirm deleted in UI
    Wait For Elements State    text=${field_name}    detached    timeout=10s

    # Wait for sync
    Sleep    5s

    # 9. Verify deletion via API
    ${list_response_after}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields_after}=    Set Variable    ${list_response_after.json()}

    ${found_field_after}=    Set Variable    ${False}
    FOR    ${field}    IN    @{fields_after}
        IF    '${field['name']}' == '${field_name}' and '${field['farm_id']}' == '${farm_id}'
            ${found_field_after}=    Set Variable    ${True}
            BREAK
        END
    END
    Should Not Be True    ${found_field_after}    Field still found in API response after deletion

    # 10. Clean up farm via API
    ${delete_farm_response}=    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=204
