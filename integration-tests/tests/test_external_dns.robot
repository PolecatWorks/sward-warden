*** Settings ***
Library    Browser
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}    http://sward.k8s

*** Test Cases ***
External DNS Check
    [Documentation]    Test to verify the application loads via the external DNS defined in the virtual service.
    ...                NOTE: Expecting potential resolution failures until gateway DNS is fully configured.
    [Tags]    k8s_only
    [Teardown]    Teardown With Video
    Check External DNS    ${EXTERNAL_DNS_URL}

*** Keywords ***
Check External DNS
    [Arguments]    ${url}
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    New Page    about:blank
    Wait Until Keyword Succeeds    12x    10s    Load Page And Verify    ${url}

Load Page And Verify
    [Arguments]    ${url}
    Go To    ${url}
    Wait For Elements State    app-root    visible    timeout=5s
