*** Settings ***
Library    RequestsLibrary

*** Variables ***
${BASE_URL}      http://sward-warden-be:8080
${HEALTH_URL}    http://sward-warden-be:8079

*** Test Cases ***
Be Health Check
    [Documentation]    Test to verify the be health endpoint is responding.
    ${response}=    GET    ${HEALTH_URL}/hams/alive    expected_status=200
    Log    Health Response: ${response.content}

Be API Hello Check
    [Documentation]    Test to verify the be API hello endpoint.
    ${response}=    GET    ${BASE_URL}/v0/hello    expected_status=200
    Log    API Response: ${response.content}
    Should Be Equal As Strings    ${response.json()['message']}    hello
