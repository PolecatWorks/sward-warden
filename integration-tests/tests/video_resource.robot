*** Settings ***
Library    Browser
Library    OperatingSystem

*** Keywords ***
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

Login As Demo User
    [Documentation]    Logs in as the default Demo User (ID 1) via the development login page
    New Page    ${EXTERNAL_DNS_URL}/login
    Wait For Elements State    id=user-card-1    visible    timeout=10s
    Click    id=user-card-1
    Wait For Elements State    css=app-home    visible    timeout=10s
