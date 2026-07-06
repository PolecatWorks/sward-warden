*** Settings ***
Library    Browser
Library    AuthRequests.py
Resource    video_resource.robot

*** Variables ***
${BE_BASE_URL}

*** Test Cases ***
Create Fields with Different Topologies
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
    &{field_poly}=    Create Dictionary    id=${0}    farm_id=${farm_id}    name=Polygon Field    area_hectares=10.0    geometry_geojson=${polygon_geojson}
    ${res_poly}=    POST    ${BE_BASE_URL}/v0/fields    headers=${headers}    json=${field_poly}    expected_status=200
    Should Contain    ${res_poly.json()['geometry_geojson']}    Polygon

    # 3. Create a field with a Point
    ${point_geojson}=    Set Variable    {"type":"Point","coordinates":[-6.5,54.5]}
    &{field_point}=    Create Dictionary    id=${0}    farm_id=${farm_id}    name=Point Field    area_hectares=5.0    geometry_geojson=${point_geojson}
    ${res_point}=    POST    ${BE_BASE_URL}/v0/fields    headers=${headers}    json=${field_point}    expected_status=200
    Should Contain    ${res_point.json()['geometry_geojson']}    Point

    # 4. Create a field with no geometry (None/empty)
    &{field_none}=    Create Dictionary    id=${0}    farm_id=${farm_id}    name=No Geo Field    area_hectares=2.5
    ${res_none}=    POST    ${BE_BASE_URL}/v0/fields    headers=${headers}    json=${field_none}    expected_status=200
    Should Be Equal    ${res_none.json()['geometry_geojson']}    ${None}

    # 5. Verify all fields in list
    ${list_response}=    GET    ${BE_BASE_URL}/v0/fields    headers=${headers}    expected_status=200
    ${fields}=    Set Variable    ${list_response.json()}
    Length Should Be    ${fields}    3

    # Clean up
    DELETE    ${BE_BASE_URL}/v0/farms/${farm_id}    headers=${headers}    expected_status=204
    DELETE    ${BE_BASE_URL}/v0/users/${user_id}    expected_status=204
