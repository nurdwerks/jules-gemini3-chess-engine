from playwright.sync_api import sync_playwright

def verify_uci_options():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:3000/index.html")

        # Wait for connection and options to load (engine sends options on 'uci' command)
        # We look for the container where options are rendered
        page.wait_for_selector("#uci-options-container")

        # Wait for at least one option to appear (e.g., Hash)
        page.wait_for_selector("text=Hash")

        # Take a screenshot of the whole page
        page.screenshot(path="verification/uci_options.png")

        browser.close()

if __name__ == "__main__":
    verify_uci_options()
