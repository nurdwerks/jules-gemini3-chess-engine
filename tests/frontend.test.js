const puppeteer = require('puppeteer');

let browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
});

afterAll(async () => {
  if (browser) await browser.close();
});

test('board is rendered as 8x8 grid', async () => {
  const page = await browser.newPage();
  await page.goto('http://localhost:8080');

  // Wait for the board to be present
  await page.waitForSelector('#chessboard');

  // Check that there are 64 squares
  const squares = await page.$$('#chessboard .square');
  expect(squares.length).toBe(64);
});
