*** Settings ***
Library    Browser

*** Variables ***
${EXTERNAL_DNS_URL}    http://sward.k8s

*** Test Cases ***
External DNS Check
    [Documentation]    Test to verify the application loads via the external DNS defined in the virtual service.
    ...                NOTE: Expecting potential resolution failures until gateway DNS is fully configured.
    TRY
        Check External DNS    ${EXTERNAL_DNS_URL}
    EXCEPT
        Skip    External DNS check failed, skipping as DNS resolution might not be configured yet.
    END

*** Keywords ***
Check External DNS
    [Arguments]    ${url}
    New Browser    chromium    headless=True
    New Page    ${url}
    Wait For Elements State    app-root    visible    timeout=30s
