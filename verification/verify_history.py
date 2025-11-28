from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000")

        # Wait for board
        page.wait_for_selector("#chessboard")

        # Select e2 (White Pawn)
        # Note: if board is flipped or not, data-alg is consistent
        page.click('div.square[data-alg="e2"]')

        # Move to e4
        page.click('div.square[data-alg="e4"]')

        # Wait for move in history "e4"
        # It's inside #move-history
        page.wait_for_selector("#move-history .move-san", state="visible")

        # Check text
        # We expect "1." and "e4"

        # Click the move "e4"
        # Using specific selector to ensure we target the move-san div
        e4_move = page.locator("#move-history .move-san").first
        e4_move.click()

        # Take screenshot including sidebar
        page.screenshot(path="verification/history_panel.png")
        print("Screenshot taken")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
