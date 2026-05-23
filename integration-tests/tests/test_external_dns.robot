*** Settings ***
Library    Browser

*** Variables ***
${EXTERNAL_DNS_URL}    http://sw-local.dev.k8s

*** Test Cases ***
External DNS Check
    [Documentation]    Test to verify the application loads via the external DNS defined in the virtual service.
    Check External DNS    ${EXTERNAL_DNS_URL}

*** Keywords ***
Check External DNS
    [Arguments]    ${url}
    New Browser    chromium    headless=True
    New Page    ${url}
    Wait For Elements State    app-root    visible    timeout=30s
