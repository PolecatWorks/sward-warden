*** Settings ***
Library    Browser
Library    OperatingSystem

*** Keywords ***
# No obvious PRD requirement
Teardown With Video
    [Documentation]    Close the browser context to finalize the video, then embed it in the log/report.
    # Close context to finalize the video file
    Close Context

    # Find the most recently created .webm video file
    ${video_dir}=    Set Variable    ${OUTPUT_DIR}/videos
    ${result}=    Run    ls -t "${video_dir}"/*.webm 2>/dev/null | head -1
    IF    "${result}" != ""
        # Extract just the filename from the full path
        ${filename}=    Evaluate    "${result}".split("/")[-1]
        Log    <video src="videos/${filename}" width="800" controls autoplay muted></video>    html=True
    END

    Close Browser    ALL

# No obvious PRD requirement
Login As Demo User
    [Documentation]    Logs in as the default Demo User (ID 1) via the development login page or Keycloak SSO
    New Page    ${EXTERNAL_DNS_URL}/login
    ${dev_user_visible}=    Run Keyword And Return Status    Wait For Elements State    css=[data-testid^="user-login-"]    visible    timeout=5s
    IF    ${dev_user_visible}
        Click    css=[data-testid^="user-login-"]
    ELSE
        Wait For Elements State    id=keycloak-login-btn    visible    timeout=5s
        Click    id=keycloak-login-btn
    END
    Wait For Elements State    css=app-home    visible    timeout=10s
