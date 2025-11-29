from playwright.sync_api import sync_playwright
import time

def verify(page):
    page.goto("http://localhost:3000")
    page.wait_for_selector("#chessboard")

    # Check if checkboxes exist
    # Ensure sidebar is open (it is by default usually, but toggle to be sure if collapsed)
    # Check body class
    if "sidebar-collapsed" in page.eval_on_selector("body", "el => el.className"):
        page.click("#sidebar-toggle-btn")

    # Scroll panel
    # We need to find the panel content div inside .board-settings-panel
    page.evaluate("document.querySelector('.board-settings-panel .panel-content').scrollTop = 2000")

    # Toggle Utilization
    page.check("#viz-utilization")

    # Make moves: e2-e4
    page.click(".square[data-alg='e2']")
    time.sleep(0.2)
    page.click(".square[data-alg='e4']")
    time.sleep(1) # Wait for engine response

    # Take screenshot
    page.screenshot(path="verification/epic71.png")

    count = page.locator(".heatmap-overlay").count()
    print(f"Heatmap overlays found: {count}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
