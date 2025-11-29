from playwright.sync_api import sync_playwright
import time

def verify_piece_sets():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # 1. Check Default (Cburnett)
            # Find a piece
            img = page.locator("img.piece").first
            src = img.get_attribute("src")
            print(f"Default src: {src}")
            if "cburnett" in src:
                print("Default is Cburnett: PASS")
            else:
                print(f"Default is Cburnett: FAIL (Got {src})")

            # 2. Select Alpha
            page.select_option("#piece-set", "alpha")
            time.sleep(0.5)
            img = page.locator("img.piece").first
            src = img.get_attribute("src")
            print(f"Alpha src: {src}")
            if "alpha" in src:
                print("Alpha Selection: PASS")
            else:
                print(f"Alpha Selection: FAIL (Got {src})")

            # 3. Select Merida
            page.select_option("#piece-set", "merida")
            time.sleep(0.5)
            img = page.locator("img.piece").first
            src = img.get_attribute("src")
            print(f"Merida src: {src}")
            if "merida" in src:
                print("Merida Selection: PASS")
            else:
                print(f"Merida Selection: FAIL (Got {src})")

            # 4. Select Unicode
            page.select_option("#piece-set", "unicode")
            time.sleep(0.5)
            # Should not be img.piece
            img_count = page.locator("img.piece").count()
            div_count = page.locator("div.piece-text").count()
            print(f"Unicode counts - Img: {img_count}, Div: {div_count}")
            if img_count == 0 and div_count > 0:
                print("Unicode Selection: PASS")
            else:
                print("Unicode Selection: FAIL")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_piece_sets()
