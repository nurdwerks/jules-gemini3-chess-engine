from playwright.sync_api import sync_playwright
import time

def verify_board_size():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard .square")

            # Set slider to 400
            page.fill("#board-size", "400")
            # Trigger input event
            page.dispatch_event("#board-size", "input")

            time.sleep(0.5)

            # Check style
            chessboard = page.locator("#chessboard")
            # Computed style might return the resolved value of the var on the element if we ask for it?
            # Or we check style attribute?
            # getPropertyValue('--board-max-width') works if it's set on the element's style or inherited.
            # Since we set it via JS on element.style, it should be there.

            max_width_var = chessboard.evaluate("el => el.style.getPropertyValue('--board-max-width')")
            print(f"Max Width Var: {max_width_var}")

            if "400px" in max_width_var:
                print("Variable update: PASS")
            else:
                 print("Variable update: FAIL")

            # Check bounding box width
            box = chessboard.bounding_box()
            print(f"Bounding Box Width: {box['width']}")

            if box['width'] <= 402: # Allow small rounding
                 print("Visual Width <= 400: PASS")
            else:
                 print("Visual Width > 400: FAIL")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_board_size()
