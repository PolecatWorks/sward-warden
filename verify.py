from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:4200/user-profile')
        page.wait_for_selector('h2', timeout=5000) # wait for page to render
        page.screenshot(path='onboarding.png')

        page.goto('http://localhost:4200/farm-management')
        page.wait_for_selector('h2', timeout=5000) # wait for page to render
        page.screenshot(path='farm.png')

        browser.close()

run()
