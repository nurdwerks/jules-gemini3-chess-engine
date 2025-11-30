from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Wait for app to load
    page.wait_for_selector(".panel-title")

    # Locate Board Settings Panel (it is usually visible in sidebar)
    # Scroll sidebar to bottom to see Information section
    sidebar = page.locator(".sidebar")

    # Find Changelog button
    changelog_btn = page.locator("#changelog-btn")

    # It might be down the page, so we might need to scroll the sidebar
    # But usually sidebar is scrollable container?
    # Let's take a screenshot of the settings panel first
    page.screenshot(path="verification/settings_panel.png")

    # Click Changelog
    changelog_btn.click()

    # Wait for modal
    page.wait_for_selector("#info-modal.active")
    page.wait_for_timeout(500) # Wait for fetch

    # Screenshot Modal
    page.screenshot(path="verification/changelog_modal.png")

    # Close Modal
    page.locator("#close-info-modal").click()
    page.wait_for_selector("#info-modal.active", state="detached")

    # Click License
    page.locator("#license-btn").click()
    page.wait_for_selector("#info-modal.active")
    page.wait_for_timeout(500)

    page.screenshot(path="verification/license_modal.png")

    # Close
    page.locator("#close-info-modal").click()

    # Check Mind Control
    mind_control = page.locator("#mind-control-mode")
    if mind_control.is_visible():
        print("Mind Control Visible")
        # Click it to trigger toast
        mind_control.click()
        page.wait_for_timeout(500) # Wait for toast
        page.screenshot(path="verification/mind_control_toast.png")
    else:
        print("Mind Control NOT Visible")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
