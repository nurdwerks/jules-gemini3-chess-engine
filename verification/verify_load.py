from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000")

        # Wait for board to load
        page.wait_for_selector(".square", timeout=5000)

        # Click a square to ensure interaction works (e.g. e2)
        # Find square e2. e2 is rank 2, file e.
        # BoardRenderer assigns data-alg="e2"
        page.click('div[data-alg="e2"]')

        time.sleep(1) # wait for highlight

        # Take screenshot
        page.screenshot(path="verification/screenshot.png")
        print("Screenshot taken")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
