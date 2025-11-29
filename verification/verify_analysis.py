from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # 1. Navigate
            page.goto("http://localhost:3000")

            # 2. Wait for connection
            expect(page.locator("#status")).to_have_text("Status: Connected", timeout=10000)

            # 3. Enable Analysis Mode
            analysis_checkbox = page.locator("#analysis-mode")
            analysis_checkbox.check()

            # 4. Wait for engine output (eval) to show something other than initial '-'
            # This confirms 'go infinite' started and is producing info
            expect(page.locator("#depth-value")).not_to_have_text("-", timeout=10000)

            print("Analysis started successfully.")

            # 5. Make a move e2-e4
            # e2 is row 6, col 4.
            # e4 is row 4, col 4.

            # Click e2
            page.locator(".square[data-alg='e2']").click()
            # Click e4
            page.locator(".square[data-alg='e4']").click()

            # 6. Verify move played on board
            time.sleep(1) # Allow for rendering
            expect(page.locator(".square[data-alg='e4'] .piece")).to_be_visible()

            # 7. Verify analysis continues/restarts
            # We expect depth to reset or increment.
            # We can check that Eval is visible.
            expect(page.locator("#eval-value")).not_to_have_text("-")

            # 8. Take screenshot
            page.screenshot(path="verification/analysis_mode.png")
            print("Screenshot saved to verification/analysis_mode.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
