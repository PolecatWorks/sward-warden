*** Settings ***
Library    Browser
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}

*** Test Cases ***
Navigate Through App
    [Documentation]    Test to navigate through dashboard, farm, field and profile.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    New Page    ${EXTERNAL_DNS_URL}/dashboard
    Get Url    ==    ${EXTERNAL_DNS_URL}/dashboard
    Go To    ${EXTERNAL_DNS_URL}/farms
    Get Url    ==    ${EXTERNAL_DNS_URL}/farms
    Go To    ${EXTERNAL_DNS_URL}/farms/1/fields
    Get Url    ==    ${EXTERNAL_DNS_URL}/farms/1/fields
    Go To    ${EXTERNAL_DNS_URL}/profile
    Get Url    ==    ${EXTERNAL_DNS_URL}/profile
