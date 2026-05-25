*** Settings ***
Library    Browser
Library    RequestsLibrary

*** Variables ***
${BASE_URL_FE}    http://sward-warden-fe-nginx-view
${BASE_URL_BE}    http://sward-warden-be

*** Test Cases ***
Field Creation and Deletion Flow
    [Documentation]    Test field creation and deletion flow end-to-end
    New Browser    chromium    headless=True
    New Page    ${BASE_URL_FE}/farms/1/fields

    # 1. Check there are no fields created
    Get Text    .text-center.p-8.bg-surface-container-lowest    contains    No fields found for this farm.

    # 2. Create a field using UI
    Click    button:has-text("Add Field")
    Fill Text    \#newFieldName    E2E Test Field
    Fill Text    \#newFieldArea    15.5
    Click    button:has-text("Save Field")

    # 3. View the created field in UI
    Wait For Elements State    "E2E Test Field"    visible
    Wait For Elements State    "15.5"    visible

    # Wait for sync
    Sleep    2s

    # 4. Check field exists via API
    ${list_response}=    GET    ${BASE_URL_BE}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}

    ${found_field}=    Set Variable    ${False}
    ${field_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    '${field['name']}' == 'E2E Test Field'
            ${found_field}=    Set Variable    ${True}
            ${field_id}=    Set Variable    ${field['id']}
            BREAK
        END
    END
    Should Be True    ${found_field}    Field not found in API response

    # 5. Delete field using UI
    Click    button[aria-label="Delete E2E Test Field"]

    # 6. Confirm deleted in UI
    Wait For Elements State    "E2E Test Field"    hidden
    Get Text    .text-center.p-8.bg-surface-container-lowest    contains    No fields found for this farm.

    # Wait for sync
    Sleep    2s

    # 7. Confirm deleted via API
    ${list_response_after}=    GET    ${BASE_URL_BE}/v0/fields    expected_status=200
    ${fields_after}=    Set Variable    ${list_response_after.json()}

    ${found_field_after}=    Set Variable    ${False}
    FOR    ${field}    IN    @{fields_after}
        IF    '${field['name']}' == 'E2E Test Field'
            ${found_field_after}=    Set Variable    ${True}
            BREAK
        END
    END
    Should Not Be True    ${found_field_after}    Field still found in API response after deletion
