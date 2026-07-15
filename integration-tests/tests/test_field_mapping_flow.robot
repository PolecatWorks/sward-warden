*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
# PRD Reference: 0003
Field Topology Creation and Mapping Verification Journey
    [Documentation]    Test defining a custom polygonal boundary in Ballycastle and verifying the map interface.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}    viewport={'width': 1280, 'height': 800}

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

    # 3. Create a Field via UI and use the map editor
    Click    id=add-field-empty-btn
    ${field_name}=    Set Variable    Ballycastle Polygon Field
    Fill Text    id=new-field-name-input    ${field_name}
    Fill Text    id=new-field-area-input    5.5
    Select Options By    id=new-field-landuse-input    value    grassland
    Select Options By    id=new-field-farm-input    value    ${farm_id}

    # Search for Ballycastle in the leaflet geosearch control
    Type Text    .glass    Ballycastle, Northern Ireland
    Sleep    1s
    Press Keys    .glass    Enter
    Sleep    2s

    # Draw a polygon (4 corners) using Leaflet-Geoman controls
    # Click the draw polygon button in the toolbar
    Click    .leaflet-pm-icon-polygon
    Sleep    1s

    # Click 4 points on the map to create a shape
    Click    .leaflet-container    position_x=300    position_y=150
    Sleep    0.5s
    Click    .leaflet-container    position_x=500    position_y=150
    Sleep    0.5s
    Click    .leaflet-container    position_x=500    position_y=250
    Sleep    0.5s
    Click    .leaflet-container    position_x=300    position_y=250
    Sleep    0.5s

    # Click the first point again to finish the polygon
    Click    .leaflet-container    position_x=300    position_y=150
    Sleep    1s

    # Save the field
    Click    id=save-new-field-btn

    # Wait for creation and navigation
    Sleep    2s

    # Click the field card to view details
    Click    text=${field_name}

    # Wait for details page to load
    Sleep    2s

    # 4. Verify the field view map contains the drawn geometry
    # The map element should be present and visible
    Get Element States    .leaflet-container    contains    visible

    # We can verify that there is an SVG path drawn on the map which represents our polygon
    Get Element States    .leaflet-interactive    contains    visible

    # 5. Clean up via API
    # Find the created field and delete it
    ${fields_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${fields_response.json()}
    FOR    ${f}    IN    @{fields}
        IF    '${f['name']}' == '${field_name}'
            DELETE    ${BE_BASE_URL}/v0/fields/${f['id']}    expected_status=200
        END
    END
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=200
