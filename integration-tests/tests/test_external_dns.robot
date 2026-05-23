*** Settings ***
Library    Browser

*** Variables ***
${BASE_URL}    http://sward.k8s

*** Test Cases ***
External DNS Check
    [Documentation]    Test to verify the application loads via the external DNS defined in the virtual service.
    New Browser    chromium    headless=True
    New Page    ${BASE_URL}
    Wait For Elements State    app-root    visible    timeout=10s
