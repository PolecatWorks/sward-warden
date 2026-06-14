*** Settings ***
Library    Browser
Library    AuthRequests.py
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
    Login As Demo User
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_id}/fields

    # Wait for sync/loading
    Sleep    2s

    # Generate unique field data
    ${field_name}=    Set Variable    E2E Test Field ${random_str}
    ${field_area}=    Set Variable    15.5

    # 3. Click "Add Field"
    Click    button >> text=Add Field    button=left

    # 4. Fill in field details and save
    Fill Text    \#newFieldName    ${field_name}
    Fill Text    \#newFieldArea    ${field_area}
    Click    button >> text=Save Field    button=left

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

    # 7. Go to field details page for deletion
    Go To    ${EXTERNAL_DNS_URL}/fields/${field_id}
    Wait For Elements State    text=${field_name}    visible    timeout=5s

    # 8. Click Delete Field to reveal confirmation panel
    Click    \#delete-field-btn    button=left
    Wait For Elements State    id=delete-confirm-panel    visible    timeout=5s

    # 9. Click Confirm Delete
    Click    \#confirm-delete-field-btn    button=left

    # 10. Confirm deleted and navigated away
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

Auto Farm Creation Flow
    [Documentation]    Test that adding a field when no farms exist automatically creates "My Farm" in the backend.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Create a brand new user via API
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${username}=    Set Variable    Auto User ${random_str}
    ${email}=    Set Variable    autouser${random_str}@example.com
    &{user_data}=    Create Dictionary    id=${0}    name=${username}    email=${email}    role=user
    ${user_response}=    POST    ${BE_BASE_URL}/v0/users    json=${user_data}    expected_status=200
    ${new_user_id}=    Convert To String    ${user_response.json()['id']}

    # 2. Login as this brand new user
    New Page    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    id=user-card-${new_user_id}    visible    timeout=10s
    Click    id=user-card-${new_user_id}
    Wait For Elements State    css=app-home    visible    timeout=10s

    # 3. Navigate to fields page (should show empty state)
    Go To    ${EXTERNAL_DNS_URL}/fields
    Wait For Elements State    id=add-field-empty-btn    visible    timeout=10s

    # 4. Click Add Field empty state button
    Click    \#add-field-empty-btn    button=left
    Wait For Elements State    id=add-field-modal    visible    timeout=5s

    # 5. Fill field details and save
    ${field_name}=    Set Variable    Auto Farm Field ${random_str}
    Fill Text    \#newFieldName    ${field_name}
    Fill Text    \#newFieldArea    10.5
    Click    \#save-field-btn    button=left

    # 6. Wait for modal to close and field to appear in the UI
    Wait For Elements State    id=add-field-modal    detached    timeout=5s
    Wait For Elements State    text=${field_name}    visible    timeout=10s

    # Wait for sync
    Sleep    5s

    # 7. Check that "My Farm" was created via API for this user
    &{headers}=    Create Dictionary    X-User-ID=${new_user_id}
    ${farms_response}=    GET    ${BE_BASE_URL}/v0/farms    headers=${headers}    expected_status=200
    ${farms}=    Set Variable    ${farms_response.json()}
    Length Should Be    ${farms}    1
    Should Be Equal As Strings    ${farms[0]['name']}    My Farm

    # Clean up field and farm via API
    ${fields_response}=    GET    ${BE_BASE_URL}/v0/fields    headers=${headers}    expected_status=200
    ${fields}=    Set Variable    ${fields_response.json()}
    DELETE    ${BE_BASE_URL}/v0/fields/${fields[0]['id']}    headers=${headers}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${farms[0]['id']}    headers=${headers}    expected_status=204
