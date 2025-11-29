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

        new_960_btn = page.locator("#new-960-btn")

        # Test Chess960 Generation
        print("Clicking New 960 Button")
        new_960_btn.click()

        # Check for success toast
        success_toast = page.locator(".toast.success")
        expect(success_toast).to_contain_text("FEN loaded successfully")
        print("Chess960 FEN loaded successfully!")

        page.screenshot(path="verification/epic67_final.png")

        browser.close()

if __name__ == "__main__":
    run()
