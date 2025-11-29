from playwright.sync_api import sync_playwright
import time

def verify_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1200, 'height': 800})
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # 1. Default (Dark + Cburnett)
            page.screenshot(path="verification/1_default.png")

            # 2. Flipped
            page.click("#flip-board-btn")
            time.sleep(0.5)
            page.screenshot(path="verification/2_flipped.png")
            page.click("#flip-board-btn") # Flip back
            time.sleep(0.5)

            # 3. Piece Set: Alpha
            page.select_option("#piece-set", "alpha")
            time.sleep(0.5)
            page.screenshot(path="verification/3_alpha.png")

            # 4. Piece Set: Merida
            page.select_option("#piece-set", "merida")
            time.sleep(0.5)
            page.screenshot(path="verification/4_merida.png")

            # Reset piece set
            page.select_option("#piece-set", "cburnett")

            # 5. Theme: Glass
            page.select_option("#board-theme", "glass")
            time.sleep(0.5)
            page.screenshot(path="verification/5_theme_glass.png")

            # 6. Theme: Newspaper
            page.select_option("#board-theme", "newspaper")
            time.sleep(0.5)
            page.screenshot(path="verification/6_theme_newspaper.png")

            # Reset theme
            page.select_option("#board-theme", "classic")

            # 7. Light Mode
            page.select_option("#ui-theme", "light")
            time.sleep(0.5)
            page.screenshot(path="verification/7_light_mode.png")

            print("Screenshots taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_screenshots()
