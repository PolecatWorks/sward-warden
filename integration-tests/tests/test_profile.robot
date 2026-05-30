*** Settings ***
Library    Browser
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}    http://sw-bengreene.dev.k8s
${BASE_URL}            ${EXTERNAL_DNS_URL}

*** Test Cases ***
Edit Profile
    [Documentation]    Test to navigate to profile page, edit the profile, and verify the changes.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    New Page    ${BASE_URL}/profile

    # Verify we are on the profile page
    Get Url    ==    ${BASE_URL}/profile

    # Wait for the edit profile form to be visible
    Wait For Elements State    id=edit-name    visible

    # Fill in the edit profile form
    Fill Text    id=edit-name    Test Name
    Fill Text    id=edit-email    test@test.com
    Fill Text    id=edit-phone    +44 7700 900077
    Fill Text    id=edit-description    This is a test description

    # Submit the form
    Click    text=Save Changes

    # Wait for the UI to update
    Wait For Elements State    text=Test Name
    Wait For Elements State    text=test@test.com
    Wait For Elements State    text="+44 7700 900077"
    Wait For Elements State    text="This is a test description"
