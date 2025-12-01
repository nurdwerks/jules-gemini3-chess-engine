const { test, expect } = require('./coverage');

test('Tree Visualization', async ({ page }) => {
  const sessionCheck = page.waitForResponse(resp => resp.url().includes('/api/user/me')).catch(() => {});
  await page.goto('/');
  await sessionCheck;

  // Mock the debug_tree.json response
  await page.route('**/debug_tree.json', async route => {
    const mockData = {
      nodes: [
        {
          move: 'e2e4',
          score: 20,
          children: [
            {
              move: 'e7e5',
              score: 15,
              children: []
            },
            {
              move: 'c7c5',
              score: 10,
              children: []
            }
          ]
        }
      ]
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });

  // Open the tree modal
  await page.click('#show-tree-btn');

  // Manually trigger onTreeReady
  await page.evaluate(() => {
    if (window.treeManager) {
        window.treeManager.onTreeReady();
    }
  });

  // Expect the modal to be visible
  await expect(page.locator('#tree-modal')).toBeVisible();

  // Now verify D3 rendering
  const svg = page.locator('#d3-tree-container svg');
  await expect(svg).toBeVisible();

  // Check for nodes
  const nodes = page.locator('g.node');
  await expect(nodes).toHaveCount(4); // Artificial Root + Mock Root + 2 children

  // Check text content - e2e4 should be visible now
  await expect(page.locator('g.node').filter({ hasText: 'e2e4' })).toBeVisible();

  // Close modal
  await page.click('#close-tree-modal');
  await expect(page.locator('#tree-modal')).not.toBeVisible();
});
