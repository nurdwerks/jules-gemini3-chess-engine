from playwright.sync_api import sync_playwright
import time

def verify_extra_themes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # Glass
            page.select_option("#board-theme", "glass")
            time.sleep(0.5)

            # Check light square color
            sq = page.locator(".square.white").first
            bg = sq.evaluate("el => window.getComputedStyle(el).backgroundColor")
            print(f"Glass Light BG: {bg}")
            if "rgba" in bg:
                print("Glass Transparency: PASS")
            else:
                 print(f"Glass Transparency: Check manually (Got {bg})")

            # Newspaper
            page.select_option("#board-theme", "newspaper")
            time.sleep(0.5)

            sq = page.locator(".square.black").first
            bg_img = sq.evaluate("el => window.getComputedStyle(el).backgroundImage")
            print(f"Newspaper BG Image: {bg_img}")
            if "radial-gradient" in bg_img:
                print("Newspaper Pattern: PASS")
            else:
                 print("Newspaper Pattern: FAIL")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_extra_themes()
