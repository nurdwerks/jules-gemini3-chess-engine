from playwright.sync_api import sync_playwright
import time

def verify_extra_piece_sets():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # 3D
            page.select_option("#piece-set", "3d")
            time.sleep(0.5)
            img = page.locator("img.piece").first
            src = img.get_attribute("src")
            print(f"3D src: {src}")
            if "3d" in src:
                print("3D Selection: PASS")

            # Pixel
            page.select_option("#piece-set", "pixel")
            time.sleep(0.5)
            img = page.locator("img.piece").first
            src = img.get_attribute("src")
            print(f"Pixel src: {src}")
            if "pixel" in src:
                print("Pixel Selection: PASS")

            style = img.evaluate("el => window.getComputedStyle(el).imageRendering")
            print(f"Pixel Style: {style}")
            # Chrome usually returns 'pixelated'
            if style == "pixelated" or style == "crisp-edges":
                print("Pixel Style: PASS")
            else:
                print("Pixel Style: FAIL")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_extra_piece_sets()
