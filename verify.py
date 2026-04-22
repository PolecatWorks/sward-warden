import asyncio
from playwright.async_api import async_playwright
import subprocess

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Start Angular development server
        server_process = subprocess.Popen(["npm", "start"], cwd="sp-fe-container")
        await asyncio.sleep(10) # Give dev server time to build and start

        await page.goto("http://localhost:4200/home/fields/1")

        # Wait a moment for rendering and mock data loading
        await asyncio.sleep(5)

        await page.screenshot(path="screenshot.png", full_page=True)
        print("Screenshot saved to screenshot.png")

        server_process.terminate()
        await browser.close()

asyncio.run(main())
