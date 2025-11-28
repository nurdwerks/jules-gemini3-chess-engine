from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navigate to the app
        page.goto("http://localhost:3000")

        # Wait for board to be rendered
        page.wait_for_selector("#chessboard .square")

        # Take initial screenshot
        page.screenshot(path="verification/step1_initial.png")

        # 2. Click White Pawn at e2 (row 6, col 4)
        e2_square = page.locator('div[data-row="6"][data-col="4"]')
        e2_square.click()

        # Wait a bit for highlights
        time.sleep(0.5)

        # Take screenshot showing highlights
        page.screenshot(path="verification/step2_highlight.png")

        # Check if e3 or e4 has the highlight class
        e3_square = page.locator('div[data-row="5"][data-col="4"]')
        e4_square = page.locator('div[data-row="4"][data-col="4"]')

        if "legal-move-hint" in e3_square.get_attribute("class") and "legal-move-hint" in e4_square.get_attribute("class"):
            print("SUCCESS: Highlights found on e3 and e4")
        else:
            print("FAILURE: Highlights not found")
            print("e3 class:", e3_square.get_attribute("class"))
            print("e4 class:", e4_square.get_attribute("class"))

        # 3. Click e4 to move
        e4_square.click()

        # Wait for move
        time.sleep(0.5)

        # Verify piece is now on e4 (img inside square)
        if e4_square.locator("img").count() > 0:
             print("SUCCESS: Piece moved to e4")
        else:
             print("FAILURE: Piece not found on e4")

        # Take final screenshot
        page.screenshot(path="verification/step3_moved.png")

        browser.close()

if __name__ == "__main__":
    run()
