from playwright.sync_api import sync_playwright
import time

def verify_board_flip():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")

            # Wait for board
            page.wait_for_selector("#chessboard .square")

            # Locate Flip Button
            flip_btn = page.locator("#flip-board-btn")

            # Click Flip Button
            flip_btn.click()
            time.sleep(0.5)

            # Check if board has class 'flipped'
            chessboard = page.locator("#chessboard")
            has_class = "flipped" in chessboard.get_attribute("class")
            print(f"Has flipped class: {has_class}")

            # Check computed style
            transform = chessboard.evaluate("el => window.getComputedStyle(el).transform")
            print(f"Board Transform: {transform}")

            # Check piece transform
            piece = page.locator(".piece").first
            piece_transform = piece.evaluate("el => window.getComputedStyle(el).transform")
            print(f"Piece Transform: {piece_transform}")

            # Verify matrix
            # rotate(180deg) is usually matrix(-1, 0, 0, -1, 0, 0)
            if "matrix(-1" in transform and "matrix(-1" in piece_transform:
                 print("SUCCESS: Board and Piece rotated 180deg")
            else:
                 print("FAILURE: Transform invalid")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_board_flip()
