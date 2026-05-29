*** Settings ***
Library    Browser

*** Variables ***
${EXTERNAL_DNS_URL}    http://sw-bengreene.dev.k8s
${BASE_URL}            ${EXTERNAL_DNS_URL}

*** Test Cases ***
Navigate Through App
    [Documentation]    Test to navigate through dashboard, farm, field and profile.
    New Browser    chromium    headless=True
    New Page    ${BASE_URL}/dashboard
    Get Url    ==    ${BASE_URL}/dashboard
    Go To    ${BASE_URL}/farms
    Get Url    ==    ${BASE_URL}/farms
    Go To    ${BASE_URL}/farms/1/fields
    Get Url    ==    ${BASE_URL}/farms/1/fields
    Go To    ${BASE_URL}/profile
    Get Url    ==    ${BASE_URL}/profile
