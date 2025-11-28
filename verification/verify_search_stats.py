from playwright.sync_api import sync_playwright
import time

def verify_search_stats():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set larger viewport to see all panels
        page = browser.new_page(viewport={"width": 1280, "height": 1200})
        try:
            page.goto("http://localhost:3000")

            # Wait for board
            page.wait_for_selector("#chessboard .square")

            # Wait for connection
            time.sleep(1)

            # Click a2 (white pawn) - Row 6, Col 0
            a2 = page.locator('.square[data-row="6"][data-col="0"]')
            a2.click()

            time.sleep(0.5)

            # Click a3 (empty) - Row 5, Col 0
            a3 = page.locator('.square[data-row="5"][data-col="0"]')
            a3.click()

            print("Made move a2a3. Waiting for engine output...")

            # Wait for search stats to update

            # Helper to check if text is not '-'
            def is_updated(locator):
                text = locator.text_content()
                return text and text.strip() != '-'

            # Wait up to 5 seconds for update
            for _ in range(20):
                if is_updated(page.locator('#depth-value')) and is_updated(page.locator('#eval-value')):
                    break
                time.sleep(0.25)

            depth = page.locator('#depth-value').text_content()
            score = page.locator('#eval-value').text_content()
            nps = page.locator('#nps-value').text_content()
            pv = page.locator('#pv-lines').text_content()

            print(f"Stats Found: Depth={depth}, Score={score}, NPS={nps}")
            print(f"PV: {pv}")

            if depth != '-' and score != '-' and nps != '-' and len(pv) > 0:
                print("Search stats verification PASSED.")
            else:
                print("Search stats verification FAILED.")
                exit(1)

            page.screenshot(path="verification/search_stats.png")

        except Exception as e:
            print(f"Error: {e}")
            exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    verify_search_stats()
