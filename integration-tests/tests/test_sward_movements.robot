*** Settings ***
Library    Browser
Library    RequestsLibrary
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Sward Movement Creation Flow
    [Documentation]    Test sward movement creation flow end-to-end within a specific farm.
    [Setup]    Create Test Farm
    [Teardown]    Teardown And Clean Up Farm
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Navigate to the created farm's sward movements page
    New Page    ${EXTERNAL_DNS_URL}/farms/${TEST_FARM_ID}/movements

    # Wait for sync/loading
    Sleep    2s

    # Generate unique movement data
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${consignee_name}=    Set Variable    E2E Consignee ${random_str}
    ${quantity}=    Set Variable    250

    # 2. Fill in movement details and save
    Select Options By    select[name="movement_type"]    value    export
    Fill Text    input[name="quantity_m3"]    ${quantity}
    Fill Text    input[name="date"]    2023-11-20
    Select Options By    select[name="manure_type"]    value    Slurry
    Fill Text    input[name="consignee_name"]    ${consignee_name}
    Fill Text    textarea[name="consignee_address"]    123 Export Lane
    Fill Text    input[name="transporter_name"]    E2E Transporter

    Click    button[type="submit"]

    # 3. Wait for movement to appear in the UI
    Wait For Elements State    text=To: ${consignee_name}    visible    timeout=10s
    Wait For Elements State    text=${quantity} m³ of Slurry    visible    timeout=10s

    # Wait for sync
    Sleep    5s

    # 4. Verify creation via API
    ${list_response}=    GET    ${BE_BASE_URL}/v0/sward-movements    expected_status=200
    ${movements}=    Set Variable    ${list_response.json()}

    ${found_movement}=    Set Variable    ${False}
    FOR    ${movement}    IN    @{movements}
        ${current_consignee}=    Evaluate    $movement.get('consignee_name')
        ${current_farm_id}=    Evaluate    str($movement.get('farm_id'))
        IF    '${current_consignee}' == '${consignee_name}' and '${current_farm_id}' == '${TEST_FARM_ID}'
            ${found_movement}=    Set Variable    ${True}
            BREAK
        END
    END
    Should Be True    ${found_movement}    Movement not found in API response

*** Keywords ***
Create Test Farm
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    E2E Parent Farm ${random_str}
    &{farm_data}=    Create Dictionary    id=${0}    name=${farm_name}    location=E2E Location    has_derogation=${True}
    ${farm_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id}=    Convert To String    ${farm_response.json()['id']}
    Set Test Variable    ${TEST_FARM_ID}    ${farm_id}

Teardown And Clean Up Farm
    Run Keyword And Ignore Error    DELETE    ${BE_BASE_URL}/v0/farms/${TEST_FARM_ID}
    Teardown With Video
