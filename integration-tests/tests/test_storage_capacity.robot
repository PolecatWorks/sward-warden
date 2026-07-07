*** Settings ***
Library    Browser
Library    String
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
# PRD Reference: 0006
Storage Capacity E2E Flow
    [Documentation]    Test adding and deleting storage capacities
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    Login As Demo User

    # Pre-requisite: we need a farm to associate
    # Let's create a farm quickly via API to use for associations
    ${farm_name}=    Set Variable    Storage E2E Farm
    &{farm_data}=    Create Dictionary    name=${farm_name}    location=Test Location    has_derogation=${FALSE}
    ${farm_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id}=    Set Variable    ${farm_response.json()['id']}

    # Generate a unique name and capacity for the lagoon to avoid database conflicts and strict mode issues
    ${random}=    Generate Random String    8    [LETTERS]
    ${lagoon_name}=    Set Variable    Lagoon ${random}
    ${random_cap}=    Generate Random String    3    123456789
    ${lagoon_capacity}=    Set Variable    5${random_cap}.2

    # 1. Navigate to inventory storage capacity
    Go To    ${EXTERNAL_DNS_URL}/inventory/storage
    Sleep    2s

    # 2. Click Add Storage button
    Click    text=Add Storage    button=left

    # 3. Fill storage details in Form
    Fill Text    input[formcontrolname="name"]    ${lagoon_name}
    Select Options By    select[formcontrolname="storage_type"]    value    liquid
    Fill Text    input[formcontrolname="capacity_volume"]    ${lagoon_capacity}
    Click    input[formcontrolname="is_covered"]

    # Note: we test leaving farm_id unassigned for now to avoid needing to select dynamic options

    Click    button[type="submit"]    button=left

    # 4. Verify storage appears in list and syncs
    Wait For Elements State    text=${lagoon_name}    visible    timeout=15s
    Wait For Elements State    text=${lagoon_capacity} m³    visible    timeout=5s

    Sleep    3s    # wait for sync to happen in background

    # Verify it exists in backend
    ${response}=    GET    ${BE_BASE_URL}/v0/inventory-storage    expected_status=200
    ${storage_response}=    Set Variable    ${response.json()}
    # Ensure there's at least one storage
    Should Not Be Empty    ${storage_response}

    # 5. Delete storage
    # Handle JS confirm dialog before clicking
    Handle Future Dialogs    action=accept
    Click    css=.bg-surface-container-lowest:has(h3:has-text("${lagoon_name}")) button[title="Delete"]    button=left

    # Verify removal from UI
    Wait For Elements State    text=${lagoon_name}    detached    timeout=5s

    # Wait for sync
    Sleep    3s

    # Verify removal from backend (could be empty or not contain the name)
    ${response_after}=    GET    ${BE_BASE_URL}/v0/inventory-storage    expected_status=200
    ${storage_response_after}=    Set Variable    ${response_after.json()}
    FOR    ${s}    IN    @{storage_response_after}
        Should Not Be Equal As Strings    ${s['name']}    ${lagoon_name}
    END
