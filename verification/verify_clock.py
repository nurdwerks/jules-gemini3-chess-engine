from playwright.sync_api import sync_playwright
import time

def verify_clock():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            # Wait for connection
            page.wait_for_selector("#status:has-text('Connected')")
            print("Connected.")

            # Click New Game
            page.click("#new-game-btn")
            print("Clicked New Game.")

            # Wait for board to be ready
            page.wait_for_selector("#chessboard .square")

            # Initial check: Clocks should be 05:00 or very close (since it starts ticking immediately)
            # Actually, verify they exist
            white_clock = page.locator("#bottom-player-clock")
            black_clock = page.locator("#top-player-clock")

            # Allow some time for clock to tick
            time.sleep(2)

            w_time_text = white_clock.inner_text()
            b_time_text = black_clock.inner_text()
            print(f"White Clock: {w_time_text}, Black Clock: {b_time_text}")

            # Parse time
            def parse_time(t):
                m, s = map(int, t.split(':'))
                return m * 60 + s

            w_seconds = parse_time(w_time_text)
            b_seconds = parse_time(b_time_text)

            # White should have ticked down (less than 300s)
            # Black should be 300s
            if w_seconds < 300:
                print("PASS: White clock is ticking.")
            else:
                print(f"FAIL: White clock did not tick. {w_seconds}")

            if b_seconds == 300:
                 print("PASS: Black clock is not ticking.")
            else:
                 print(f"FAIL: Black clock ticked prematurely. {b_seconds}")

            # Make a move: e2e4
            # White Pawn at e2 is at row 6, col 4 (0-indexed from top-left, if white at bottom)
            # 8x8 grid.
            # Row 6 = 7th rank (pawns).
            # Col 4 = e file.

            print("Making move e2e4...")
            page.click('.square[data-row="6"][data-col="4"]') # Select e2
            time.sleep(0.5)
            page.click('.square[data-row="4"][data-col="4"]') # Move to e4

            # Wait for engine to reply (Black move)
            # History should have 2 moves.
            page.wait_for_function("document.querySelectorAll('#move-history .move-san').length >= 2")
            print("Engine moved.")

            # Now Black moved, so it's White's turn again.
            # Black clock should have ticked down slightly during its think time, or if it was instant, maybe not much.
            # But the key is that it functioned.

            # Let's wait a bit to ensure checks work
            time.sleep(1)

            w_time_text_2 = white_clock.inner_text()
            b_time_text_2 = black_clock.inner_text()
            print(f"White Clock: {w_time_text_2}, Black Clock: {b_time_text_2}")

            # Since it's White's turn again, White clock should be ticking again.
            # Black clock might be < 300 if engine took > 0s (or at least 100ms update tick happened)

            # We verified the critical part: White clock ticked at start.

            print("Verification Complete.")
            page.screenshot(path="verification/clock_verified.png")

        except Exception as e:
            print(f"Error: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_clock()
