const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/coach/athlete/a3d34f01-c65b-47dc-87a4-d7d8c8ccebc9', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
