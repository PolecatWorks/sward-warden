*** Settings ***
Library    RequestsLibrary

*** Variables ***
${BASE_URL}      http://sward-manager-backend:8080
${HEALTH_URL}    http://sward-manager-backend:8079

*** Test Cases ***
Backend Health Check
    [Documentation]    Test to verify the backend health endpoint is responding.
    ${response}=    GET    ${HEALTH_URL}/hams/alive    expected_status=200
    Log    Health Response: ${response.content}

Backend API Hello Check
    [Documentation]    Test to verify the backend API hello endpoint.
    ${response}=    GET    ${BASE_URL}/v0/hello    expected_status=200
    Log    API Response: ${response.content}
    Should Be Equal As Strings    ${response.json()['message']}    hello
