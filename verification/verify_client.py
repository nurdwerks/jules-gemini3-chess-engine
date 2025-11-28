from playwright.sync_api import sync_playwright
import time

def verify_client():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")

            # Wait for board
            page.wait_for_selector("#chessboard .square")

            # Click e2 (white pawn) - Row 6, Col 4
            e2 = page.locator('.square[data-row="6"][data-col="4"]')
            e2.click()

            time.sleep(0.5)

            # Click e4 (empty) - Row 4, Col 4
            e4 = page.locator('.square[data-row="4"][data-col="4"]')
            e4.click()

            time.sleep(1)

            e4_img = e4.locator('img.piece')
            if e4_img.count() > 0:
                print("Move e2e4 visualized successfully.")
            else:
                print("Move e2e4 failed visual check.")

            page.screenshot(path="verification/client_move.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_client()
