*** Settings ***
Library    Browser
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
Edit Profile
    [Documentation]    Test to navigate to profile page, edit the profile, and verify the changes.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    New Page    ${EXTERNAL_DNS_URL}/profile

    # Verify we are on the profile page
    Get Url    ==    ${EXTERNAL_DNS_URL}/profile

    # Wait for the edit profile form to be visible and data to load
    Wait For Elements State    id=edit-name    visible
    Sleep    2s

    # Fill in the edit profile form
    Fill Text    id=edit-name    Test Name
    Fill Text    id=edit-email    test@test.com
    Fill Text    id=edit-phone    +44 7700 900077
    Fill Text    id=edit-description    This is a test description

    # Submit the form
    Click    text=Save Changes    button=left    force=${True}

    # Wait for the API call to complete by reloading the page and verifying persistence
    Sleep    1s
    Reload
    Wait For Elements State    id=edit-name    visible
    Sleep    2s

    # Verify the changes persisted
    Get Property    id=edit-name    value    ==    Test Name
    Get Property    id=edit-email    value    ==    test@test.com
    Get Property    id=edit-phone    value    ==    +44 7700 900077
    Get Property    id=edit-description    value    ==    This is a test description
