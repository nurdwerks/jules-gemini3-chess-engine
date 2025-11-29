from playwright.sync_api import sync_playwright

def verify_tournament_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Check title
        print("Page loaded:", page.title())

        # Click Tournament button
        tournament_btn = page.locator("#tournament-btn")
        tournament_btn.wait_for(state="visible")
        print("Tournament button visible")
        tournament_btn.click()

        # Check Modal
        modal = page.locator("#tournament-setup-modal")
        modal.wait_for(state="visible")
        print("Modal visible")

        page.screenshot(path="verification/tournament_modal.png")
        browser.close()

if __name__ == "__main__":
    verify_tournament_ui()
