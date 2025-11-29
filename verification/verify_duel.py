from playwright.sync_api import sync_playwright, expect
import time
import re

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        page.goto("http://localhost:3000")
        page.wait_for_selector("#chessboard")

        # Open Duel Modal
        print("Clicking Engine Duel Button")
        page.click("#engine-duel-btn")

        # Wait for modal
        modal = page.locator("#duel-setup-modal")
        expect(modal).to_have_class(re.compile(r"active"))
        print("Duel Modal Opened")

        # Configure Duel
        page.fill("#engine-a-name", "AlphaBot")
        page.fill("#engine-a-elo", "1200")

        page.fill("#engine-b-name", "BetaBot")
        page.fill("#engine-b-elo", "1800")

        # Start Duel
        print("Starting Duel")
        page.click("#start-duel-btn")

        # Check if modal closed
        # Note: Depending on timing, the modal might still have 'active' class if transition is slow,
        # but playwright waits for state usually if using assertions correctly.
        # But 'not_to_have_class' might be tricky if it has other classes.
        # The class string is "modal-overlay", not "active".
        expect(modal).not_to_have_class(re.compile(r"active"))
        print("Duel Modal Closed")

        # Check for success/info toast
        # The toast message is "Active: AlphaBot (1200)"
        # We need to wait for it.
        toast = page.locator(".toast").first
        expect(toast).to_contain_text("Active: AlphaBot (1200)")
        print("Duel Started Toast Verified")

        # Check player names
        expect(page.locator("#bottom-player-name")).to_have_text("AlphaBot")
        expect(page.locator("#top-player-name")).to_have_text("BetaBot")
        print("Player names verified")

        page.screenshot(path="verification/duel_started.png")

        browser.close()

if __name__ == "__main__":
    run()
