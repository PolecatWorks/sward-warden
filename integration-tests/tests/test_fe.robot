*** Settings ***
Library    RequestsLibrary

*** Variables ***
${BASE_URL}    http://sward-warden-fe:8080

*** Test Cases ***
Fe Index Check
    [Documentation]    Test to verify the fe is serving the index.html page.
    ${response}=    GET    ${BASE_URL}/index.html    expected_status=200
    Log    Response was: ${response.content}
    Should Contain    ${response.content.decode('utf-8')}    <app-root></app-root>
