*** Settings ***
Library    Browser
Resource    video_resource.robot

*** Variables ***
${EXTERNAL_DNS_URL}
${BE_BASE_URL}

*** Test Cases ***
# PRD Reference: 0003
Edit Profile
    [Documentation]    Test to navigate to profile page, edit the profile via pencil icon modal, and verify the changes.
    [Teardown]    Teardown With Video
    New Browser    chromium    headless=True
    New Context    recordVideo={"dir": "${OUTPUT_DIR}/videos"}
    Login As Demo User
    Go To    ${EXTERNAL_DNS_URL}/profile

    # Verify we are on the profile page
    Get Url    ==    ${EXTERNAL_DNS_URL}/profile

    # Wait for the profile to load
    Wait For Elements State    id=edit-profile-btn    visible    timeout=10s
    Sleep    2s

    # Click the pencil icon to open the edit form
    Click    id=edit-profile-btn    button=left

    # Wait for the inline form to appear
    Wait For Elements State    id=edit-name    visible    timeout=5s
    Sleep    1s

    # Fill in the edit profile form
    Fill Text    id=edit-name    Test Name
    Fill Text    id=edit-email    test@test.com
    Fill Text    id=edit-phone    +44 7700 900077
    Fill Text    id=edit-description    This is a test description

    # Submit the form
    Click    id=save-edit-profile-btn    button=left

    # Wait for the form to close
    Wait For Elements State    id=save-edit-profile-btn    detached    timeout=5s
    Sleep    1s

    # Reload and re-open the form to verify persistence
    Reload
    Wait For Elements State    id=edit-profile-btn    visible    timeout=10s
    Sleep    2s
    Click    id=edit-profile-btn    button=left
    Wait For Elements State    id=edit-name    visible    timeout=5s
    Sleep    1s

    # Verify the changes persisted
    Get Property    id=edit-name    value    ==    Test Name
    Get Property    id=edit-email    value    ==    test@test.com
    Get Property    id=edit-phone    value    ==    +44 7700 900077
    Get Property    id=edit-description    value    ==    This is a test description

    # Close the form
    Click    id=cancel-edit-profile-btn    button=left
