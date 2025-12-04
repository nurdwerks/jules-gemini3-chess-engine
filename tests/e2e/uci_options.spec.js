const { test, expect } = require('./coverage');

test('UCI Option Rendering', async ({ page }) => {
  // Mock logged-in user to enable features
  await page.addInitScript(() => {
    Object.defineProperty(window, 'INITIAL_USER', {
      value: { username: 'testuser', role: 'user' },
      writable: false
    });
  });

  await page.goto('/');

  // Ensure sidebar is open to see options
  const sidebar = page.locator('.sidebar');
  if (await sidebar.isHidden()) {
      await page.click('#sidebar-toggle-btn');
  }

  // Inject options via UIManager
  await page.evaluate(() => {
    const ui = window.settingsManager.uiManager;
    // Clear existing options to make verification cleaner (optional, but good)
    ui.elements.uciOptions.innerHTML = '';

    // Inject different types
    ui.parseOption('option name TestCheck type check default false', () => {});
    ui.parseOption('option name TestSpin type spin default 50 min 0 max 100', () => {});
    ui.parseOption('option name TestCombo type combo default A var A var B', () => {});
    ui.parseOption('option name TestString type string default Hello', () => {});
    ui.parseOption('option name TestButton type button', () => {});
  });

  // Verify Checkbox
  const checkbox = page.locator('input[type="checkbox"][data-option-name="TestCheck"]');
  await expect(checkbox).toBeVisible();
  await expect(checkbox).not.toBeChecked();

  // Verify Spin
  const spin = page.locator('input[type="number"][data-option-name="TestSpin"]');
  await expect(spin).toBeVisible();
  await expect(spin).toHaveValue('50');
  await expect(spin).toHaveAttribute('min', '0');
  await expect(spin).toHaveAttribute('max', '100');

  // Verify Combo
  const combo = page.locator('select[data-option-name="TestCombo"]');
  await expect(combo).toBeVisible();
  await expect(combo).toHaveValue('A');
  const options = combo.locator('option');
  await expect(options).toHaveCount(2);

  // Verify String
  const str = page.locator('input[type="text"][data-option-name="TestString"]');
  await expect(str).toBeVisible();
  await expect(str).toHaveValue('Hello');

  // Verify Button
  const optionItem = page.locator('.option-item').filter({ hasText: 'TestButton:' });
  await expect(optionItem).toBeVisible();
  const btn = optionItem.locator('button');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText('Trigger');
});
