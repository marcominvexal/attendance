const { chromium } = require('playwright');

async function startMyDay() {
  const username = process.env.MIHCM_USERNAME;
  const password = process.env.MIHCM_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing MIHCM_USERNAME or MIHCM_PASSWORD environment variables');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // 1. Navigate — redirects to login
    console.log('Navigating to Time Capture...');
    await page.goto('https://app.myhcm.pk/ontime/timecapture', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 2. Login
    console.log('Filling credentials...');
    await page.waitForSelector('input[type="text"], input[name="Username"], input[id="Username"]', {
      timeout: 15000,
    });
    await page.fill('input[type="text"], input[name="Username"], input[id="Username"]', username);
    await page.fill('input[type="password"], input[name="Password"], input[id="Password"]', password);
    await page.click('button[type="submit"], input[type="submit"], button:has-text("SIGN IN"), button:has-text("Sign in")');
    console.log('Sign in clicked.');

    // 3. Wait for Time Capture page
    await page.waitForURL('**/ontime/timecapture**', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('On Time Capture page.');

    // 4. Take screenshot for reference
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

    const bodyText = await page.innerText('body');
    if (bodyText.includes('End') && bodyText.includes('My Day')) {
      console.log('Already clocked in today (End My Day visible). Skipping click.');
      await page.screenshot({ path: 'after-click-screenshot.png', fullPage: true });
      return;
    }

    // 5. Click the Start My Day button — id="btn_save"
    console.log('Clicking #btn_save (Start My Day)...');
    await page.waitForSelector('#btn_save', { state: 'visible', timeout: 10000 });
    await page.click('#btn_save');
    console.log('✅ Clicked #btn_save.');

    // 6. Confirm
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('End') && document.body.innerText.includes('My Day'),
        { timeout: 10000 }
      );
      console.log('✅ Day started successfully!');
    } catch {
      console.warn('⚠️  Could not confirm End My Day within 10s. Check after-click-screenshot.png.');
    }
    await page.screenshot({ path: 'after-click-screenshot.png', fullPage: true });

  } finally {
    await browser.close();
  }
}

startMyDay().catch((err) => {
  console.error('Automation failed:', err.message);
  process.exit(1);
});
