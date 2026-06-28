*** Settings ***
Library    AuthRequests.py

*** Variables ***
${FE_BASE_URL}

*** Test Cases ***
# No obvious PRD requirement
Fe Index Check
    [Documentation]    Test to verify the fe is serving the index.html page.
    ${response}=    GET    ${FE_BASE_URL}/index.html    expected_status=200
    Log    Response was: ${response.content}
    Should Contain    ${response.content.decode('utf-8')}    <app-root></app-root>
