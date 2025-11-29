from playwright.sync_api import sync_playwright
import time

def verify_board_themes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # Helper to get color of a white square (e.g. a8 is white? No a8 is white, 0+0=0 even)
            # a8 (0,0) is white.
            # a7 (1,0) is black.

            # Find a white square
            white_sq = page.locator(".square.white").first

            def get_bg():
                return white_sq.evaluate("el => window.getComputedStyle(el).backgroundColor")

            print(f"Classic White BG: {get_bg()}")
            # #E3E3E3 -> rgb(227, 227, 227)

            # Select Green
            page.select_option("#board-theme", "green")
            time.sleep(0.5)
            print(f"Green White BG: {get_bg()}")
            # #EEEED2 -> rgb(238, 238, 210)

            # Select Blue
            page.select_option("#board-theme", "blue")
            time.sleep(0.5)
            print(f"Blue White BG: {get_bg()}")
             # #E3E3E3 (Blue theme reuses E3E3E3 for light square, changes dark square)

            # Check Dark square for Blue
            dark_sq = page.locator(".square.black").first
            def get_dark_bg():
                return dark_sq.evaluate("el => window.getComputedStyle(el).backgroundColor")

            print(f"Blue Dark BG: {get_dark_bg()}")
            # #5CA5CD -> rgb(92, 165, 205)

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_board_themes()
