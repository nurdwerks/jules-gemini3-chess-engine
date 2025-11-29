from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to the app
            page.goto("http://localhost:3000")

            # Wait for board to appear
            expect(page.locator("#chessboard")).to_be_visible()

            # Check for pieces (should be startpos)
            # There should be 32 pieces
            expect(page.locator(".piece")).to_have_count(32)

            # Check for controls
            expect(page.locator("#new-game-btn")).to_be_visible()
            expect(page.locator("#flip-board-btn")).to_be_visible()

            # Check if status says Connected (SocketHandler works)
            # It might take a moment
            expect(page.locator("#status")).to_contain_text("Connected", timeout=5000)

            # Take screenshot
            page.screenshot(path="verification/refactor_verify.png")
            print("Verification successful!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/refactor_failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
