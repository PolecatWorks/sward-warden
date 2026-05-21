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
