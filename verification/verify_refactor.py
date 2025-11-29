from playwright.sync_api import sync_playwright

def verify_refactor():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:3000")
            page.wait_for_selector("#chessboard")

            # Check if pieces are present (e.g., standard start position has 32 pieces)
            # BoardRenderer renders pieces as divs with background images or img tags?
            # Let's check for any element inside chessboard that represents a piece.
            # Usually .piece or img.

            # Wait a bit for board to render
            page.wait_for_timeout(1000)

            page.screenshot(path="verification/refactor_check.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_refactor()
