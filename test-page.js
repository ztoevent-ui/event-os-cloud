const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  await page.goto('http://localhost:3000/projects/123/auction/display');
  await page.waitForTimeout(5000);
  await browser.close();
})();
