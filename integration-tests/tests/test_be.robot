*** Settings ***
Library    RequestsLibrary

*** Variables ***
${BASE_URL}      http://sward-warden-be
${BE_POD_IP}     ${EMPTY}

*** Test Cases ***
Be Health Check
    [Documentation]    Test to verify the be health endpoint is responding directly on the pod IP.
    Skip If    '${BE_POD_IP}' == '${EMPTY}'    BE_POD_IP is empty
    ${response}=    GET    http://${BE_POD_IP}:8079/hams/alive    expected_status=200
    Log    Health Response: ${response.content}

Be API Hello Check
    [Documentation]    Test to verify the be API hello endpoint via the Service (default port 80).
    ${response}=    GET    ${BASE_URL}/v0/hello    expected_status=200
    Log    API Response: ${response.content}
    Should Be Equal As Strings    ${response.json()['message']}    hello

Be API Hello Check via Pod
    [Documentation]    Test to verify the be API hello endpoint directly on the pod IP (port 8080).
    Skip If    '${BE_POD_IP}' == '${EMPTY}'    BE_POD_IP is empty
    ${response}=    GET    http://${BE_POD_IP}:8080/v0/hello    expected_status=200
    Log    API Response: ${response.content}
    Should Be Equal As Strings    ${response.json()['message']}    hello

# *** Test Cases - Users ***
Users BREAD Operations
    [Documentation]    Test BREAD operations for Users. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # 1. Add (Create) User
    ${random_str}=    Evaluate    str(random.randint(1000, 9999))    modules=random
    &{user_data}=    Create Dictionary    id=${0}    name=Test User    email=test_${random_str}@example.com    role=user
    ${create_response}=    POST    ${BASE_URL}/v0/users    json=${user_data}    expected_status=200
    Log    Create User Response: ${create_response.content}
    ${user_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${user_id}
    Should Be Equal As Strings    ${create_response.json()['name']}    Test User
    Should Be Equal As Strings    ${create_response.json()['email']}    test_${random_str}@example.com

    # 2. Browse (List) Users
    ${list_response}=    GET    ${BASE_URL}/v0/users    expected_status=200
    Log    List Users Response: ${list_response.content}
    ${users}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${users}

    # Missing Endpoints:
    # 3. Read: GET /v0/users/${user_id} is missing.
    # 4. Edit: PUT/PATCH /v0/users/${user_id} is missing.
    # 5. Delete: DELETE /v0/users/${user_id} is missing.

# *** Test Cases - Farms ***
Farms BREAD Operations
    [Documentation]    Test BREAD operations for Farms. Note: Read (by ID) and Edit are not implemented in the backend.

    # 1. Add (Create) Farm
    &{farm_data}=    Create Dictionary    id=${0}    name=Test Farm    location=123 Test Lane    has_derogation=${True}
    ${create_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    Log    Create Farm Response: ${create_response.content}
    ${farm_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${farm_id}
    Should Be Equal As Strings    ${create_response.json()['name']}    Test Farm
    Should Be Equal As Strings    ${create_response.json()['location']}    123 Test Lane

    # 2. Browse (List) Farms
    ${list_response}=    GET    ${BASE_URL}/v0/farms    expected_status=200
    Log    List Farms Response: ${list_response.content}
    ${farms}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${farms}

    # Missing Endpoints:
    # 3. Read: GET /v0/farms/${farm_id} is missing.
    # 4. Edit: PUT/PATCH /v0/farms/${farm_id} is missing.

    # 5. Delete (Delete) Farm
    ${delete_response}=    DELETE    ${BASE_URL}/v0/farms/${farm_id}    expected_status=204
    Log    Delete Farm Response Code: ${delete_response.status_code}

# *** Test Cases - Fields ***
Fields BREAD Operations
    [Documentation]    Test BREAD operations for Fields. Note: Read (by ID) and Edit are not implemented in the backend.

    # Prerequisite: Need a farm ID to create a field
    &{farm_data}=    Create Dictionary    id=${0}    name=Field Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id}=    Convert To String    ${farm_response.json()['id']}

    # 1. Add (Create) Field
    ${farm_id_int}=    Convert To Integer    ${farm_id}
    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=Test Field    area_hectares=${10.5}    land_use=Grassland
    ${create_response}=    POST    ${BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    Log    Create Field Response: ${create_response.content}
    ${field_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${field_id}
    Should Be Equal As Strings    ${create_response.json()['name']}    Test Field

    # 2. Browse (List) Fields
    ${list_response}=    GET    ${BASE_URL}/v0/fields    expected_status=200
    Log    List Fields Response: ${list_response.content}
    ${fields}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${fields}

    # Missing Endpoints:
    # 3. Read: GET /v0/fields/${field_id} is missing.
    # 4. Edit: PUT/PATCH /v0/fields/${field_id} is missing.

    # 5. Delete (Delete) Field
    ${delete_response}=    DELETE    ${BASE_URL}/v0/fields/${field_id}    expected_status=204
    Log    Delete Field Response Code: ${delete_response.status_code}

# *** Test Cases - Events ***
Events BREAD Operations
    [Documentation]    Test BREAD operations for Events. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # Prerequisite: Need a farm and field ID to create an event
    &{farm_data}=    Create Dictionary    id=${0}    name=Event Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=Event Test Field    area_hectares=${10.5}    land_use=Grassland
    ${field_response}=    POST    ${BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id_int}=    Convert To Integer    ${field_response.json()['id']}

    # 1. Add (Create) Event
    &{event_data}=    Create Dictionary    id=${0}    field_id=${field_id_int}    event_type=slurry_application    description=Test Event    date=2024-05-23
    ${create_response}=    POST    ${BASE_URL}/v0/events    json=${event_data}    expected_status=200
    Log    Create Event Response: ${create_response.content}
    ${event_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${event_id}
    Should Be Equal As Strings    ${create_response.json()['event_type']}    slurry_application

    # 2. Browse (List) Events
    ${list_response}=    GET    ${BASE_URL}/v0/events    expected_status=200
    Log    List Events Response: ${list_response.content}
    ${events}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${events}

    # Missing Endpoints:
    # 3. Read: GET /v0/events/${event_id} is missing.
    # 4. Edit: PUT/PATCH /v0/events/${event_id} is missing.
    # 5. Delete: DELETE /v0/events/${event_id} is missing.

# *** Test Cases - Soil Analyses ***
Soil Analyses BREAD Operations
    [Documentation]    Test BREAD operations for Soil Analyses. Note: Read (by ID) and Edit are not implemented in the backend.

    # Prerequisite: Need a farm and field ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Soil Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=Soil Test Field    area_hectares=${10.5}    land_use=Grassland
    ${field_response}=    POST    ${BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id_int}=    Convert To Integer    ${field_response.json()['id']}

    # 1. Add (Create) Soil Analysis
    &{soil_data}=    Create Dictionary    id=${0}    field_id=${field_id_int}    sample_date=2024-05-23    ph_level=${6.5}    phosphorus_index=${2}    potassium_index=${2}    magnesium_index=${2}
    ${create_response}=    POST    ${BASE_URL}/v0/soil_analyses    json=${soil_data}    expected_status=200
    Log    Create Soil Analysis Response: ${create_response.content}
    ${soil_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${soil_id}

    # 2. Browse (List) Soil Analyses
    ${list_response}=    GET    ${BASE_URL}/v0/soil_analyses    expected_status=200
    Log    List Soil Analyses Response: ${list_response.content}
    ${analyses}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${analyses}

    # Missing Endpoints:
    # 3. Read: GET /v0/soil_analyses/${soil_id} is missing.
    # 4. Edit: PUT/PATCH /v0/soil_analyses/${soil_id} is missing.

    # 5. Delete (Delete) Soil Analysis
    ${delete_response}=    DELETE    ${BASE_URL}/v0/soil_analyses/${soil_id}    expected_status=204
    Log    Delete Soil Analysis Response Code: ${delete_response.status_code}

# *** Test Cases - Fertilisation Plans ***
Fertilisation Plans BREAD Operations
    [Documentation]    Test BREAD operations for Fertilisation Plans. Note: Read (by ID) and Edit are not implemented in the backend.

    # Prerequisite: Need a farm and field ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Fert Plan Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=Fert Plan Test Field    area_hectares=${10.5}    land_use=Grassland
    ${field_response}=    POST    ${BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id_int}=    Convert To Integer    ${field_response.json()['id']}

    # 1. Add (Create) Fertilisation Plan
    &{plan_data}=    Create Dictionary    id=${0}    field_id=${field_id_int}    crop_type=Grass    target_yield=${10.0}    nitrogen_requirement=${100.0}    phosphorus_requirement=${50.0}    potassium_requirement=${50.0}    application_date=2024-05-23
    ${create_response}=    POST    ${BASE_URL}/v0/fertilisation_plans    json=${plan_data}    expected_status=200
    Log    Create Fertilisation Plan Response: ${create_response.content}
    ${plan_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${plan_id}

    # 2. Browse (List) Fertilisation Plans
    ${list_response}=    GET    ${BASE_URL}/v0/fertilisation_plans    expected_status=200
    Log    List Fertilisation Plans Response: ${list_response.content}
    ${plans}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${plans}

    # Missing Endpoints:
    # 3. Read: GET /v0/fertilisation_plans/${plan_id} is missing.
    # 4. Edit: PUT/PATCH /v0/fertilisation_plans/${plan_id} is missing.

    # 5. Delete (Delete) Fertilisation Plan
    ${delete_response}=    DELETE    ${BASE_URL}/v0/fertilisation_plans/${plan_id}    expected_status=204
    Log    Delete Fertilisation Plan Response Code: ${delete_response.status_code}

# *** Test Cases - Farm Records ***
Farm Records BREAD Operations
    [Documentation]    Test BREAD operations for Farm Records. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # Prerequisite: Need a farm ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Record Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    # 1. Add (Create) Farm Record
    &{record_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    agricultural_area=${100.0}    manure_storage_capacity=${500.0}    year=${2024}    has_derogation=${True}
    ${create_response}=    POST    ${BASE_URL}/v0/farm_records    json=${record_data}    expected_status=200
    Log    Create Farm Record Response: ${create_response.content}
    ${record_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${record_id}

    # 2. Browse (List) Farm Records
    ${list_response}=    GET    ${BASE_URL}/v0/farm_records    expected_status=200
    Log    List Farm Records Response: ${list_response.content}
    ${records}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${records}

    # Missing Endpoints:
    # 3. Read: GET /v0/farm_records/${record_id} is missing.
    # 4. Edit: PUT/PATCH /v0/farm_records/${record_id} is missing.
    # 5. Delete: DELETE /v0/farm_records/${record_id} is missing.

# *** Test Cases - Fertiliser Applications ***
Fertiliser Applications BREAD Operations
    [Documentation]    Test BREAD operations for Fertiliser Applications. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # Prerequisite: Need a farm, field, and event ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Fert App Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=Fert App Test Field    area_hectares=${10.5}    land_use=Grassland
    ${field_response}=    POST    ${BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id_int}=    Convert To Integer    ${field_response.json()['id']}

    &{event_data}=    Create Dictionary    id=${0}    field_id=${field_id_int}    event_type=fertiliser_application    description=Test Event    date=2024-05-23
    ${event_response}=    POST    ${BASE_URL}/v0/events    json=${event_data}    expected_status=200
    ${event_id_int}=    Convert To Integer    ${event_response.json()['id']}

    # 1. Add (Create) Fertiliser Application
    &{app_data}=    Create Dictionary    id=${0}    event_id=${event_id_int}    fertiliser_type=Urea    amount_applied=${100.0}    nitrogen_content=${46.0}    is_protected_urea=${True}    buffer_zone_confirmed=${True}    evidence_of_control=Notes
    ${create_response}=    POST    ${BASE_URL}/v0/fertiliser_applications    json=${app_data}    expected_status=200
    Log    Create Fertiliser Application Response: ${create_response.content}
    ${app_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${app_id}

    # 2. Browse (List) Fertiliser Applications
    ${list_response}=    GET    ${BASE_URL}/v0/fertiliser_applications    expected_status=200
    Log    List Fertiliser Applications Response: ${list_response.content}
    ${apps}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${apps}

    # Missing Endpoints:
    # 3. Read: GET /v0/fertiliser_applications/${app_id} is missing.
    # 4. Edit: PUT/PATCH /v0/fertiliser_applications/${app_id} is missing.
    # 5. Delete: DELETE /v0/fertiliser_applications/${app_id} is missing.

# *** Test Cases - Organic Manure Applications ***
Organic Manure Applications BREAD Operations
    [Documentation]    Test BREAD operations for Organic Manure Applications. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # Prerequisite: Need a farm, field, and event ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Organic App Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    &{field_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    name=Organic App Test Field    area_hectares=${10.5}    land_use=Grassland
    ${field_response}=    POST    ${BASE_URL}/v0/fields    json=${field_data}    expected_status=200
    ${field_id_int}=    Convert To Integer    ${field_response.json()['id']}

    &{event_data}=    Create Dictionary    id=${0}    field_id=${field_id_int}    event_type=slurry_application    description=Test Event    date=2024-05-23
    ${event_response}=    POST    ${BASE_URL}/v0/events    json=${event_data}    expected_status=200
    ${event_id_int}=    Convert To Integer    ${event_response.json()['id']}

    # 1. Add (Create) Organic Manure Application
    &{app_data}=    Create Dictionary    id=${0}    event_id=${event_id_int}    manure_type=Cattle Slurry    volume_applied_m3_per_ha=${10.0}    is_lesse_applied=${True}    weather_conditions_confirmed=${True}    buffer_zone_distance_meters=${10}
    ${create_response}=    POST    ${BASE_URL}/v0/organic_manure_applications    json=${app_data}    expected_status=200
    Log    Create Organic Manure Application Response: ${create_response.content}
    ${app_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${app_id}

    # 2. Browse (List) Organic Manure Applications
    ${list_response}=    GET    ${BASE_URL}/v0/organic_manure_applications    expected_status=200
    Log    List Organic Manure Applications Response: ${list_response.content}
    ${apps}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${apps}

    # Missing Endpoints:
    # 3. Read: GET /v0/organic_manure_applications/${app_id} is missing.
    # 4. Edit: PUT/PATCH /v0/organic_manure_applications/${app_id} is missing.
    # 5. Delete: DELETE /v0/organic_manure_applications/${app_id} is missing.

# *** Test Cases - Compliance Breaches ***
Compliance Breaches BREAD Operations
    [Documentation]    Test BREAD operations for Compliance Breaches. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # Prerequisite: Need a farm ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Compliance Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    # 1. Add (Create) Compliance Breach
    &{breach_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    breach_type=Buffer Zone Violation    severity=High    breach_date=2024-05-23
    ${create_response}=    POST    ${BASE_URL}/v0/compliance-breaches    json=${breach_data}    expected_status=200
    Log    Create Compliance Breach Response: ${create_response.content}
    ${breach_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${breach_id}

    # 2. Browse (List) Compliance Breaches
    ${list_response}=    GET    ${BASE_URL}/v0/compliance-breaches    expected_status=200
    Log    List Compliance Breaches Response: ${list_response.content}
    ${breaches}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${breaches}

    # Missing Endpoints:
    # 3. Read: GET /v0/compliance-breaches/${breach_id} is missing.
    # 4. Edit: PUT/PATCH /v0/compliance-breaches/${breach_id} is missing.
    # 5. Delete: DELETE /v0/compliance-breaches/${breach_id} is missing.

# *** Test Cases - Sward Movements ***
Sward Movements BREAD Operations
    [Documentation]    Test BREAD operations for Sward Movements. Note: Read (by ID), Edit, and Delete are not implemented in the backend.

    # Prerequisite: Need a farm ID
    &{farm_data}=    Create Dictionary    id=${0}    name=Movement Test Farm    location=123 Test Lane    has_derogation=${True}
    ${farm_response}=    POST    ${BASE_URL}/v0/farms    json=${farm_data}    expected_status=200
    ${farm_id_int}=    Convert To Integer    ${farm_response.json()['id']}

    # 1. Add (Create) Sward Movement
    &{movement_data}=    Create Dictionary    id=${0}    farm_id=${farm_id_int}    movement_type=import    quantity_m3=${100.0}    date=2024-05-23    manure_type=Cattle Slurry
    ${create_response}=    POST    ${BASE_URL}/v0/sward-movements    json=${movement_data}    expected_status=200
    Log    Create Sward Movement Response: ${create_response.content}
    ${movement_id}=    Convert To String    ${create_response.json()['id']}
    Should Not Be Empty    ${movement_id}

    # 2. Browse (List) Sward Movements
    ${list_response}=    GET    ${BASE_URL}/v0/sward-movements    expected_status=200
    Log    List Sward Movements Response: ${list_response.content}
    ${movements}=    Set Variable    ${list_response.json()}
    Should Not Be Empty    ${movements}

    # Missing Endpoints:
    # 3. Read: GET /v0/sward-movements/${movement_id} is missing.
    # 4. Edit: PUT/PATCH /v0/sward-movements/${movement_id} is missing.
    # 5. Delete: DELETE /v0/sward-movements/${movement_id} is missing.

# *** Test Cases - Admin ***
Admin Endpoints Check
    [Documentation]    Test Admin operations.
    &{admin_headers}=    Create Dictionary    X-User-Role=admin

    # Health
    ${health_response}=    GET    ${BASE_URL}/v0/admin/health    headers=${admin_headers}    expected_status=200
    Log    Admin Health Response: ${health_response.content}
    Should Be Equal As Strings    ${health_response.json()['status']}    ok

    # Farms
    ${farms_response}=    GET    ${BASE_URL}/v0/admin/farms    headers=${admin_headers}    expected_status=200
    Log    Admin Farms Response: ${farms_response.content}
    Should Not Be Empty    ${farms_response.json()}

    # Fields
    ${fields_response}=    GET    ${BASE_URL}/v0/admin/fields    headers=${admin_headers}    expected_status=200
    Log    Admin Fields Response: ${fields_response.content}
    Should Not Be Empty    ${fields_response.json()}

    # Events
    ${events_response}=    GET    ${BASE_URL}/v0/admin/events    headers=${admin_headers}    expected_status=200
    Log    Admin Events Response: ${events_response.content}
    Should Not Be Empty    ${events_response.json()}

    # Audit Logs
    ${logs_response}=    GET    ${BASE_URL}/v0/admin/audit-logs    headers=${admin_headers}    expected_status=200
    Log    Admin Audit Logs Response: ${logs_response.content}
    Should Not Be Empty    ${logs_response.json()}
