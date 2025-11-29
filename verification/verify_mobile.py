from playwright.sync_api import sync_playwright

def verify_mobile_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use iPhone SE viewport size
        page = browser.new_page(viewport={"width": 375, "height": 667})

        # Navigate to the local server
        page.goto("http://localhost:3000")

        # Wait for the board to render
        page.wait_for_selector("#chessboard")

        # Take a screenshot
        page.screenshot(path="verification/mobile_layout.png", full_page=True)

        # Verify the layout is vertical
        # #dashboard should be flex-direction column.
        # We can check the bounding box of the sidebar vs the board.
        # Board should be above sidebar.

        board_box = page.locator(".chessboard-panel").bounding_box()
        sidebar_box = page.locator(".sidebar").bounding_box()

        if board_box["y"] + board_box["height"] <= sidebar_box["y"]:
             print("Layout verified: Board is above sidebar (Vertical Stacking)")
        else:
             print("Layout verification failed: Sidebar is not below board")
             # Print details
             print(f"Board bottom: {board_box['y'] + board_box['height']}")
             print(f"Sidebar top: {sidebar_box['y']}")

        browser.close()

if __name__ == "__main__":
    verify_mobile_layout()
