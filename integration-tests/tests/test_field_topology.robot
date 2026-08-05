*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Create Fields with Different Topologies via API
    [Documentation]    Test creating fields with a Polygon, a Point, and no geometry via API.
    [Teardown]    Teardown With Video

    # 1. Create a user and a farm
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${username}=    Set Variable    Topo User ${random_str}
    &{user_data}=    Create Dictionary    id=${0}    name=${username}    email=topouser${random_str}@example.com    role=user
    ${user_response}=    POST    ${BE_BASE_URL}/v0/users    json=${user_data}    expected_status=200
    ${user_id}=    Convert To String    ${user_response.json()['id']}

    &{headers}=    Create Dictionary    X-User-ID=${user_id}

    &{farm_data}=    Create Dictionary    id=${0}    name=Topo Farm ${random_str}    location=Test Location    has_derogation=${True}
    ${farm_response}=    POST    ${BE_BASE_URL}/v0/farms    headers=${headers}    json=${farm_data}    expected_status=200
    ${farm_id}=    Convert To Integer    ${farm_response.json()['id']}

    # 2. Create a field with a Polygon
    ${polygon_geojson}=    Set Variable    {"type":"Polygon","coordinates":[[[-6.5,54.5],[-6.4,54.5],[-6.4,54.6],[-6.5,54.6],[-6.5,54.5]]]}
    &{field_poly}=    Create Dictionary    id=${0}    farm_id=${farm_id}    name=Polygon Field    area_hectares=${10.0}    geometry_geojson=${polygon_geojson}
    ${res_poly}=    POST    ${BE_BASE_URL}/v0/fields    headers=${headers}    json=${field_poly}    expected_status=200
    Should Contain    ${res_poly.json()['geometry_geojson']}    Polygon

    # 3. Create a field with a Point
    ${point_geojson}=    Set Variable    {"type":"Point","coordinates":[-6.5,54.5]}
    &{field_point}=    Create Dictionary    id=${0}    farm_id=${farm_id}    name=Point Field    area_hectares=${5.0}    geometry_geojson=${point_geojson}
    ${res_point}=    POST    ${BE_BASE_URL}/v0/fields    headers=${headers}    json=${field_point}    expected_status=200
    Should Contain    ${res_point.json()['geometry_geojson']}    Point

    # 4. Create a field with no geometry (None/empty)
    &{field_none}=    Create Dictionary    id=${0}    farm_id=${farm_id}    name=No Geo Field    area_hectares=${2.5}
    ${res_none}=    POST    ${BE_BASE_URL}/v0/fields    headers=${headers}    json=${field_none}    expected_status=200
    Should Be Equal    ${res_none.json()['geometry_geojson']}    ${None}

    # 5. Verify all fields in list
    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    headers=${headers}    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    Length Should Be    ${fields}    3

    # Clean up
    DELETE    ${BE_BASE_URL}/v0/fields/${res_poly.json()['id']}    headers=${headers}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/fields/${res_point.json()['id']}    headers=${headers}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/fields/${res_none.json()['id']}    headers=${headers}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    headers=${headers}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/users/${user_id}    headers=${headers}    expected_status=204

Field Creation with Topology Flow via UI
    [Documentation]    Test creating fields with a Polygon (in Ballycastle), a Point, and no geometry via UI, verifying visualization on field details map.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}    viewport={'width': 1280, 'height': 800}

    # 1. Create a Farm via API to act as parent
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    ${farm_name}=    Set Variable    E2E Parent Farm Topo ${random_str}
    &{farm_data}=    Create Dictionary    id=${0}    name=${farm_name}    location=E2E Location    has_derogation=${True}
    ${farm_response}=    POST    ${BE_BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id}=    Convert To String    ${farm_response.json()['id']}

    # 2. Navigate to the created farm's fields page
    Login As Demo User
    Go To    ${EXTERNAL_DNS_URL}/farms/${farm_id}/fields

    # Wait for sync/loading
    Sleep    2s

    # Part 1: Create Minimal Field (No Geometry)
    ${field_name_none}=    Set Variable    E2E Field No Geo ${random_str}
    ${field_area_none}=    Set Variable    5.0

    Click    button >> text=Add Field    button=left
    Fill Text    \#newFieldName    ${field_name_none}
    Fill Text    \#newFieldArea    ${field_area_none}
    Click    button >> text=Save Field    button=left
    Wait For Elements State    text=${field_name_none}    visible    timeout=10s
    Sleep    2s

    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    ${field_none_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    $field['name'] == $field_name_none and str($field['farm_id']) == str($farm_id)
            ${field_none_id}=    Convert To String    ${field['id']}
            Should Be Equal    ${field['geometry_geojson']}    ${None}
            BREAK
        END
    END
    Should Not Be Empty    ${field_none_id}

    # Part 2: Create Field with Polygon (Ballycastle search & draw)
    ${field_name_poly}=    Set Variable    Ballycastle E2E Field Poly ${random_str}
    ${field_area_poly}=    Set Variable    10.0

    Click    button >> text=Add Field    button=left
    Fill Text    \#newFieldName    ${field_name_poly}
    Fill Text    \#newFieldArea    ${field_area_poly}
    Select Options By    \#newFieldLandUse    value    grassland

    # Search for Ballycastle in the leaflet geosearch control
    Type Text    .glass    Ballycastle, Northern Ireland
    Sleep    1s
    Press Keys    .glass    Enter
    Sleep    5s

    # Draw Polygon using leaflet-geoman controls on the map
    Click    .leaflet-pm-icon-polygon    button=left
    Click With Options    .leaflet-container    position_x=100    position_y=100
    Click With Options    .leaflet-container    position_x=200    position_y=100
    Click With Options    .leaflet-container    position_x=200    position_y=200
    Click With Options    .leaflet-container    position_x=100    position_y=200
    Click    .action-finish    button=left
    Sleep    2s
    Click    button >> text=Save Field    button=left
    Wait For Elements State    text=${field_name_poly}    visible    timeout=10s
    Sleep    2s

    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    ${field_poly_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    $field['name'] == $field_name_poly and str($field['farm_id']) == str($farm_id)
            ${field_poly_id}=    Convert To String    ${field['id']}
            Should Contain    ${field['geometry_geojson']}    Polygon
            BREAK
        END
    END
    Should Not Be Empty    ${field_poly_id}

    # Part 3: Create Field with Point
    ${field_name_point}=    Set Variable    E2E Field Point ${random_str}
    ${field_area_point}=    Set Variable    2.5

    Click    button >> text=Add Field    button=left
    Fill Text    \#newFieldName    ${field_name_point}
    Fill Text    \#newFieldArea    ${field_area_point}

    # Draw Point using leaflet-geoman
    Sleep    1s
    Click    .leaflet-pm-icon-marker    button=left
    Click With Options    .leaflet-container    position_x=300    position_y=300
    Sleep    2s
    Click    button >> text=Save Field    button=left
    Wait For Elements State    text=${field_name_point}    visible    timeout=10s
    Sleep    2s

    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    ${field_point_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    $field['name'] == $field_name_point and str($field['farm_id']) == str($farm_id)
            ${field_point_id}=    Convert To String    ${field['id']}
            Should Contain    ${field['geometry_geojson']}    Point
            BREAK
        END
    END
    Should Not Be Empty    ${field_point_id}

    # Check field details page visualises them and renders interactive map elements
    Go To    ${EXTERNAL_DNS_URL}/fields/${field_point_id}
    Wait For Elements State    text=${field_name_point}    visible    timeout=5s
    Get Element States    .leaflet-container    contains    visible

    Go To    ${EXTERNAL_DNS_URL}/fields/${field_poly_id}
    Wait For Elements State    text=${field_name_poly}    visible    timeout=5s
    Get Element States    .leaflet-container    contains    visible
    Get Element States    .leaflet-interactive    contains    visible

    # Clean up farm and fields via API
    DELETE    ${BE_BASE_URL}/v0/fields/${field_none_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/fields/${field_poly_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/fields/${field_point_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=204
