from playwright.sync_api import Page, expect, sync_playwright

def verify_connection(page: Page):
    # Navigate to the app
    page.goto("http://localhost:3000")

    # Wait for the status to show "Connected"
    status_locator = page.locator("#status")
    expect(status_locator).to_have_text("Status: Connected")

    # Take a screenshot
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_connection(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
