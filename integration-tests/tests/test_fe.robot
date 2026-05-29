*** Settings ***
Library    RequestsLibrary

*** Variables ***
${FE_BASE_URL}    http://sward-warden-fe-nginx-view

*** Test Cases ***
Fe Index Check
    [Documentation]    Test to verify the fe is serving the index.html page.
    ${response}=    GET    ${FE_BASE_URL}/index.html    expected_status=200
    Log    Response was: ${response.content}
    Should Contain    ${response.content.decode('utf-8')}    <app-root></app-root>
