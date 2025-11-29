from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # 1. Play some moves
        page.click("#self-play-btn")
        time.sleep(5) # Wait for moves
        page.click("#self-play-btn") # Stop

        # 2. Verify Material Bar Container
        assert page.locator(".material-bar-container").first.is_visible()

        # 3. Verify Graphs Panel Tabs
        assert page.locator(".tab-btn[data-tab='material-chart']").is_visible()

        # Click Time Chart tab
        page.click(".tab-btn[data-tab='time-chart']")
        time.sleep(0.5)

        # 4. Click Analyze Game
        page.click("#analyze-game-btn")
        time.sleep(1)
        assert page.locator("#analysis-report-modal").is_visible()

        # 5. Take Screenshot
        page.screenshot(path="verification/verify_graphs.png")

        browser.close()

if __name__ == "__main__":
    run()
