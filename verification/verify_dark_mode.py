from playwright.sync_api import sync_playwright
import time

def verify_dark_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # 1. Check Default (Dark)
            body = page.locator("body")
            classes = body.get_attribute("class") or ""
            print(f"Default classes: '{classes}'")
            if "light-mode" not in classes:
                print("Default is Dark: PASS")
            else:
                print("Default is Dark: FAIL")

            # Check BG Color
            bg_color = body.evaluate("el => window.getComputedStyle(el).backgroundColor")
            print(f"Dark BG: {bg_color}")
            # #181B21 -> rgb(24, 27, 33)

            # 2. Switch to Light
            page.select_option("#ui-theme", "light")
            time.sleep(0.5)

            classes = body.get_attribute("class")
            print(f"Light classes: '{classes}'")
            if "light-mode" in classes:
                print("Switch to Light: PASS")
            else:
                 print("Switch to Light: FAIL")

            bg_color = body.evaluate("el => window.getComputedStyle(el).backgroundColor")
            print(f"Light BG: {bg_color}")
            # #F4F5F5 -> rgb(244, 245, 245)

            if "244" in bg_color:
                 print("Light Color applied: PASS")
            else:
                 print("Light Color applied: FAIL")

            # 3. Persistence
            page.reload()
            page.wait_for_selector("#chessboard .square")

            classes = body.get_attribute("class")
            print(f"Reload classes: '{classes}'")
            if "light-mode" in classes:
                 print("Persistence: PASS")
            else:
                 print("Persistence: FAIL")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dark_mode()
