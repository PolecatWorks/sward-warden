*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Storage Capacity E2E Flow
    [Documentation]    Test adding and deleting storage capacities
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    Login As Demo User

    # Pre-requisite: we need a farm to associate
    # Let's create a farm quickly via API to use for associations
    ${farm_name}=    Set Variable    Storage E2E Farm
    ${farm_payload}=    Set Variable    {"name": "${farm_name}", "location": "Test Location", "has_derogation": false}
    ${farm_response}=    POST User Data    ${BE_BASE_URL}/v0/farms    ${farm_payload}    test-user
    ${farm_id}=    Set Variable    ${farm_response['id']}

    # 1. Navigate to inventory storage capacity
    Go To    ${EXTERNAL_DNS_URL}/inventory/storage
    Sleep    2s

    # 2. Click Add Storage button
    Click    text=Add Storage    button=left

    # 3. Fill storage details in Form
    Fill Text    input[formcontrolname="name"]    Test Liquid Lagoon
    Select Options By    select[formcontrolname="storage_type"]    value    liquid
    Fill Text    input[formcontrolname="capacity_volume"]    5000.5
    Click    input[formcontrolname="is_covered"]

    # Note: we test leaving farm_id unassigned for now to avoid needing to select dynamic options

    Click    text=Save    button=left

    # 4. Verify storage appears in list and syncs
    Wait For Elements State    text=Test Liquid Lagoon    visible    timeout=15s
    Wait For Elements State    text=5000.5 m³    visible    timeout=5s

    Sleep    3s    # wait for sync to happen in background

    # Verify it exists in backend
    ${storage_response}=    GET User Data    ${BE_BASE_URL}/v0/inventory-storage    test-user
    # Ensure there's at least one storage
    Should Not Be Empty    ${storage_response}

    # 5. Delete storage
    # Handle JS confirm dialog before clicking
    Handle Future Dialogs    action=accept
    Click    button[title="Delete"]    button=left

    # Verify removal from UI
    Wait For Elements State    text=Test Liquid Lagoon    detached    timeout=5s

    # Wait for sync
    Sleep    3s

    # Verify removal from backend (could be empty or not contain the name)
    ${storage_response_after}=    GET User Data    ${BE_BASE_URL}/v0/inventory-storage    test-user
    FOR    ${s}    IN    @{storage_response_after}
        Should Not Be Equal As Strings    ${s['name']}    Test Liquid Lagoon
    END
