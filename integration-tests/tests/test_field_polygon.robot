*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
# PRD Reference: 0008
Field Polygon Creation and Mapping Verification Journey
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
    Fill Text    id=newFieldName    ${field_name}
    Fill Text    id=newFieldArea    5.5
    Select Options By    id=newFieldLandUse    value    grassland

    # Search for Ballycastle in the leaflet geosearch control
    Type Text    .glass    Ballycastle, Northern Ireland
    Sleep    1s
    Press Keys    .glass    Enter
    Sleep    5s

    # Programmatically set the Ballycastle polygon geometry via the Angular component and trigger change detection
    Evaluate JavaScript    app-fields    (elem) => { const parentComp = ng.getComponent(elem); const geojsonStr = '{"type":"Polygon","coordinates":[[[-6.251,55.201],[-6.249,55.201],[-6.249,55.199],[-6.251,55.199],[-6.251,55.201]]]}'; parentComp.newFieldGeometry_geojson = geojsonStr; ng.applyChanges(parentComp); const mapEl = elem.querySelector('app-field-map-editor'); if (mapEl) { const mapComp = ng.getComponent(mapEl); mapComp.loadGeoJson(geojsonStr); ng.applyChanges(mapComp); } }
    Sleep    2s

    ${fe_val}=    Evaluate JavaScript    app-fields    (elem) => ng.getComponent(elem).newFieldGeometry_geojson
    Log    Geometry value in FE component is: ${fe_val}

    # Save the field
    Click    id=save-field-btn

    # Wait for creation and navigation
    Sleep    3s

    # Print fields from API to debug
    ${debug_res}=    GET    ${BE_BASE_URL}/v0/fields
    Log    API Fields: ${debug_res.json()}

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
            DELETE    ${BE_BASE_URL}/v0/fields/${f['id']}    expected_status=204
        END
    END
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=204
