*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Field Creation with Topology Flow
    [Documentation]    Test creating fields with a Polygon, a Point, and no geometry via UI.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}

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
            ${field_none_id}=    Set Variable    ${field['id']}
            Should Be Equal    ${field['geometry_geojson']}    ${None}
            BREAK
        END
    END
    Should Not Be Empty    ${field_none_id}

    # Part 2: Create Field with Polygon
    ${field_name_poly}=    Set Variable    E2E Field Poly ${random_str}
    ${field_area_poly}=    Set Variable    10.0

    Click    button >> text=Add Field    button=left
    Fill Text    \#newFieldName    ${field_name_poly}
    Fill Text    \#newFieldArea    ${field_area_poly}

    # Draw Polygon using leaflet-geoman
    Click    .leaflet-pm-icon-polygon    button=left
    Click With Options    .leaflet-container    position_x=100    position_y=100
    Click With Options    .leaflet-container    position_x=200    position_y=100
    Click With Options    .leaflet-container    position_x=200    position_y=200
    # Finish polygon by double-clicking the last point, or double-clicking near the last
    Click With Options    .leaflet-container    position_x=100    position_y=200    clickCount=2

    Click    button >> text=Save Field    button=left
    Wait For Elements State    text=${field_name_poly}    visible    timeout=10s
    Sleep    2s

    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    ${field_poly_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    $field['name'] == $field_name_poly and str($field['farm_id']) == str($farm_id)
            ${field_poly_id}=    Set Variable    ${field['id']}
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
    Click    .leaflet-pm-icon-marker    button=left
    Click With Options    .leaflet-container    position_x=300    position_y=300

    Click    button >> text=Save Field    button=left
    Wait For Elements State    text=${field_name_point}    visible    timeout=10s
    Sleep    2s

    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    ${field_point_id}=    Set Variable    ${EMPTY}
    FOR    ${field}    IN    @{fields}
        IF    $field['name'] == $field_name_point and str($field['farm_id']) == str($farm_id)
            ${field_point_id}=    Set Variable    ${field['id']}
            Should Contain    ${field['geometry_geojson']}    Point
            BREAK
        END
    END
    Should Not Be Empty    ${field_point_id}

    # Check field details page visualises them
    Go To    ${EXTERNAL_DNS_URL}/fields/${field_point_id}
    Wait For Elements State    text=${field_name_point}    visible    timeout=5s
    Wait For Elements State    .leaflet-container    visible    timeout=5s

    Go To    ${EXTERNAL_DNS_URL}/fields/${field_poly_id}
    Wait For Elements State    text=${field_name_poly}    visible    timeout=5s
    Wait For Elements State    .leaflet-container    visible    timeout=5s

    # Clean up farm and fields via API
    DELETE    ${BE_BASE_URL}/v0/fields/${field_none_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/fields/${field_poly_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/fields/${field_point_id}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    expected_status=204
