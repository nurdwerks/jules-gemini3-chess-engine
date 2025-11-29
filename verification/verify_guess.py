from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        page.goto("http://localhost:3000")
        page.wait_for_selector("#chessboard")

        # Import PGN
        print("Clicking Import PGN")
        page.click("#import-pgn-btn")

        # Fill PGN
        pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6"
        page.fill("#pgn-input-area", pgn)

        print("Clicking Load PGN Confirm")
        page.click("#load-pgn-confirm-btn")

        # Verify Loaded
        expect(page.locator(".toast", has_text="PGN loaded")).to_be_visible()
        print("PGN Loaded Toast verified")

        # Select Guess Mode
        print("Selecting Guess Mode")
        page.select_option("#game-mode", "guess")

        # Verify Started
        expect(page.locator(".toast", has_text="Guess Mode")).to_be_visible()
        print("Guess Mode Toast verified")

        # Attempt Correct Move e2-e4
        # e2 is 6,4. e4 is 4,4.
        print("Attempting e2-e4")
        page.click('.square[data-alg="e2"]')
        page.click('.square[data-alg="e4"]')

        # Verify Correct
        expect(page.locator(".toast", has_text="Correct!")).to_be_visible()
        print("Correct Move verified")

        # Wait for reply (500ms + animation)
        time.sleep(1.5)

        # Verify e5 is present (Black pawn on e5)
        # Using generic piece check
        expect(page.locator('.square[data-alg="e5"] .piece')).to_have_count(1)
        print("Reply move e5 verified")

        # Attempt Incorrect Move h2-h3 (Expected Nf3)
        print("Attempting h2-h3 (Incorrect)")
        page.click('.square[data-alg="h2"]')
        page.click('.square[data-alg="h3"]')

        # Verify Incorrect
        expect(page.locator(".toast", has_text="Incorrect")).to_be_visible()
        print("Incorrect Move verified")

        page.screenshot(path="verification/guess_test.png")

        browser.close()

if __name__ == "__main__":
    run()
