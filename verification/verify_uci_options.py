from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Verify the label exists
        expect(page.get_by_text("Clear Hash:")).to_be_visible(timeout=5000)

        # Verify the button exists
        expect(page.get_by_role("button", name="Trigger")).to_be_visible()

        # Check for groups
        engine_group = page.locator("fieldset[data-group='Engine']")
        expect(engine_group).to_be_visible()

        # Verify Hash option is inside Engine group (exact match to avoid Clear Hash)
        expect(engine_group.get_by_text("Hash:", exact=True)).to_be_visible()

        search_group = page.locator("fieldset[data-group='Search']")
        expect(search_group).to_be_visible()
        expect(search_group.locator("text=UCI_Elo:")).to_be_visible()

        # Take screenshot of the sidebar (or full page)
        # The options are in #uci-options
        page.locator("#uci-options").screenshot(path="verification/uci_options.png")

        browser.close()

if __name__ == "__main__":
    run()
