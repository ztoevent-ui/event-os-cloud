const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to http://localhost:3000/projects/123/auction');
  try {
    await page.goto('http://localhost:3000/projects/123/auction', { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  await browser.close();
})();
