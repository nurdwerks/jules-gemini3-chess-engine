from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:3000")

        # Wait for board
        page.wait_for_selector("#chessboard")

        # 1. Draw User Arrow (a1 -> a3) - using a1 to avoid moving piece conflict?
        # Move e2->e4 happens later.
        # Let's draw arrow h1->h3
        sq_h1 = page.locator('.square[data-alg="h1"]')
        sq_h3 = page.locator('.square[data-alg="h3"]')

        box_h1 = sq_h1.bounding_box()
        box_h3 = sq_h3.bounding_box()

        if box_h1 and box_h3:
            page.mouse.move(box_h1['x'] + box_h1['width']/2, box_h1['y'] + box_h1['height']/2)
            page.mouse.down(button="right")
            page.mouse.move(box_h3['x'] + box_h3['width']/2, box_h3['y'] + box_h3['height']/2)
            page.mouse.up(button="right")

        # 2. Highlight Square (d4) -> Right click
        sq_d4 = page.locator('.square[data-alg="d4"]')
        box_d4 = sq_d4.bounding_box()
        if box_d4:
            page.mouse.move(box_d4['x'] + box_d4['width']/2, box_d4['y'] + box_d4['height']/2)
            page.mouse.down(button="right")
            page.mouse.up(button="right")

        # 3. Enable Last Move Arrow
        # The panel might be collapsed or hidden? "Board Settings" is usually visible.
        # Ensure sidebar is visible (default)
        page.locator("#show-arrow-last").check()

        # 4. Make a move (e2 -> e4)
        sq_e2 = page.locator('.square[data-alg="e2"]')
        sq_e4 = page.locator('.square[data-alg="e4"]')

        sq_e2.click()
        sq_e4.click()

        # Wait for move animation and engine response
        page.wait_for_timeout(2000)

        # 5. Clear Analysis Check
        # Click Clear Analysis button
        # page.locator("#clear-analysis-btn").click()
        # Wait, I want to SEE the analysis first in the screenshot.

        # Take screenshot
        page.screenshot(path="verification/arrows_test.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
