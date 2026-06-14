*** Settings ***
Library    Browser
Library    RequestsLibrary
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Immediate Validation and Form UX Flow
    [Documentation]    Test that required fields in event logging modals (specifically Log Planting) immediately show visual error highlights when opened, that the Save button is disabled, and that filling the fields clears highlights and enables Save.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

    # 1. Create a Farm and Field via API
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    Validation Farm ${random_str}
    &{farm_data}=    Create Dictionary    id=${0}    name=${farm_name}    location=Validation Location    has_derogation=${True}
    ${farm_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id}=    Convert To String    ${farm_response.json()['id']}
    ${farm_id_int}=    Convert To Integer    ${farm_id}

    ${field_name}=    Set Variable    Validation Field ${random_str}
    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=${field_name}    area_hectares=${12.5}    land_use=grassland
    ${field_response}=    POST    ${BE_BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id}=    Convert To String    ${field_response.json()['id']}

    # 2. Login as Demo User and navigate to the Field detail page
    Login As Demo User
    Go To    ${EXTERNAL_DNS_URL}/fields/${field_id}
    Wait For Elements State    text=${field_name}    visible    timeout=10s

    # Wait for sync/loading
    Sleep    2s

    # 3. Click the "Planting" quick action button
    Click    text=Planting    button=left

    # 4. Verify the "Log Planting" modal is visible
    Wait For Elements State    text=Log Planting    visible    timeout=5s

    # 5. Verify the required fields (Crop Type and Variety) immediately show red error borders
    Wait For Elements State    css=input[name="crop"].border-error    visible    timeout=5s
    Wait For Elements State    css=input[name="variety"].border-error    visible    timeout=5s

    # 6. Verify that the "Save Record" button is disabled
    Get Element States    button[type="submit"] >> text=Save Record    contains    disabled

    # 7. Fill in Crop Type and check that crop error styling is detached, but button is still disabled
    Fill Text    css=input[name="crop"]    Barley
    Wait For Elements State    css=input[name="crop"].border-error    detached    timeout=5s
    Get Element States    button[type="submit"] >> text=Save Record    contains    disabled

    # 8. Fill in Variety and check that variety error styling is detached
    Fill Text    css=input[name="variety"]    Golden
    Wait For Elements State    css=input[name="variety"].border-error    detached    timeout=5s

    # 9. Verify that the "Save Record" button is now enabled
    Get Element States    button[type="submit"] >> text=Save Record    not contains    disabled

    # 10. Click Save Record to submit the form
    Click    button[type="submit"] >> text=Save Record    button=left

    # 11. Verify that the modal closes and the event appears in the timeline
    Wait For Elements State    text=Log Planting    detached    timeout=5s
    Wait For Elements State    text=Planted Barley (Variety: Golden)    visible    timeout=10s

    # Wait for sync
    Sleep    5s

    # 12. Clean up Field and Farm via API
    DELETE    ${BE_BASE_URL}/v0/fields/${field_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=204
