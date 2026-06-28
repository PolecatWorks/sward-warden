*** Settings ***
Library    Browser
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}

*** Test Cases ***
# No obvious PRD requirement
Navigate Through App
    [Documentation]    Test to navigate through dashboard, farm, field and profile.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    Login As Demo User
    Go To    ${EXTERNAL_DNS_URL}/home
    Get Url    ==    ${EXTERNAL_DNS_URL}/home
    Go To    ${EXTERNAL_DNS_URL}/farms
    Get Url    ==    ${EXTERNAL_DNS_URL}/farms
    Go To    ${EXTERNAL_DNS_URL}/farms/1/fields
    Get Url    ==    ${EXTERNAL_DNS_URL}/farms/1/fields
    Go To    ${EXTERNAL_DNS_URL}/fields
    Get Url    ==    ${EXTERNAL_DNS_URL}/fields
    Go To    ${EXTERNAL_DNS_URL}/profile
    Get Url    ==    ${EXTERNAL_DNS_URL}/profile
