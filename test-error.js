const { chromium } = require('@playwright/test');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('PAGE EXCEPTION:', error.message);
    });

    await page.goto('http://localhost:3000/arena/9fe1b18e-a14e-46cc-b9d8-f8a4fd1a3c37/admin', { waitUntil: 'networkidle' });

    await browser.close();
})();
