from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        page.goto("http://localhost:3000")
        page.wait_for_selector("#chessboard")

        # Test Armageddon
        print("Clicking Armageddon Button")
        page.click("#armageddon-btn")

        # Verify Toast
        toast = page.locator(".toast").first
        expect(toast).to_contain_text("Armageddon Mode")
        print("Armageddon Toast verified")

        # Verify Clocks (White 05:00, Black 04:00)
        # Note: If flipped, top/bottom changes. Default is not flipped. Top=Black, Bottom=White.
        expect(page.locator("#bottom-player-clock")).to_contain_text("05:00")
        expect(page.locator("#top-player-clock")).to_contain_text("04:00")
        print("Armageddon Clocks verified")

        # Test Handicap
        print("Selecting Handicap Knight Odds")
        page.select_option("#handicap-select", "knight-b1")

        print("Clicking New Game")
        page.click("#new-game-btn")

        # Verify Knight b1 is missing.
        # Square b1 is row 7, col 1 (0-indexed? No, rows 0-7 from top? chess.js uses 0=rank 8)
        # In UI: data-alg="b1"
        b1 = page.locator('.square[data-alg="b1"]')
        # It should be empty or not contain a piece image.
        expect(b1.locator(".piece")).to_have_count(0)

        # Verify a normal piece exists, e.g. a1 (Rook)
        a1 = page.locator('.square[data-alg="a1"]')
        expect(a1.locator(".piece")).to_have_count(1)

        print("Handicap b1 empty verified")

        page.screenshot(path="verification/modes_test.png")

        browser.close()

if __name__ == "__main__":
    run()
