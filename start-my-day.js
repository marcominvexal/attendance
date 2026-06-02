const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startMyDay() {
  const username = process.env.MIHCM_USERNAME;
  const password = process.env.MIHCM_PASSWORD;
  const proxyServer = process.env.MIHCM_PROXY_SERVER;
  const proxyUsername = process.env.MIHCM_PROXY_USERNAME;
  const proxyPassword = process.env.MIHCM_PROXY_PASSWORD;

  if (!username || !password) {
    throw new Error('Missing MIHCM_USERNAME or MIHCM_PASSWORD environment variables');
  }

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (proxyServer) {
    launchOptions.proxy = {
      server: proxyServer,
    };
    if (proxyUsername) {
      launchOptions.proxy.username = proxyUsername;
    }
    if (proxyPassword) {
      launchOptions.proxy.password = proxyPassword;
    }
    console.log(`Using proxy server: ${proxyServer}`);
  } else {
    console.log('No proxy configured. Using runner public IP.');
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // 1. Go directly to Time Capture — it will redirect to login automatically
    console.log('Navigating to Time Capture (will redirect to login)...');
    await page.goto('https://app.myhcm.pk/ontime/timecapture', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 2. Fill username
    console.log('Filling credentials...');
    await page.waitForSelector('input[type="text"], input[name="Username"], input[id="Username"]', {
      timeout: 15000,
    });
    await page.fill('input[type="text"], input[name="Username"], input[id="Username"]', username);

    // 3. Fill password
    await page.fill('input[type="password"], input[name="Password"], input[id="Password"]', password);
    console.log('Credentials entered.');

    // 4. Click SIGN IN
    await page.click(
      'button[type="submit"], input[type="submit"], button:has-text("SIGN IN"), button:has-text("Sign in")'
    );
    console.log('Sign in clicked. Waiting for Time Capture page...');

    // 5. Wait until we land back on Time Capture
    await page.waitForURL('**/ontime/timecapture**', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('On Time Capture page.');

    // 6. Let the page render fully
    await sleep(3000);

    // 7. Click "Start My Day"; if not present, click "End My Day"
    console.log('Looking for action button ("Start My Day" preferred, fallback "End My Day")...');
    const actions = [
      {
        label: 'Start My Day',
        selectors: [
          'text="Start My Day"',
          ':text("Start My Day")',
          'button:has-text("Start My Day")',
          'div:has-text("Start My Day")',
          'span:has-text("Start My Day")',
        ],
      },
      {
        label: 'End My Day',
        selectors: [
          'text="End My Day"',
          ':text("End My Day")',
          'button:has-text("End My Day")',
          'div:has-text("End My Day")',
          'span:has-text("End My Day")',
        ],
      },
    ];

    let clicked = false;
    let clickedLabel = '';
    for (const action of actions) {
      for (const selector of action.selectors) {
        try {
          const el = page.locator(selector).first();
          if ((await el.count()) > 0) {
            await el.waitFor({ state: 'visible', timeout: 5000 });
            await el.click();
            console.log(`✅ Clicked "${action.label}" (selector: ${selector})`);
            clicked = true;
            clickedLabel = action.label;
            break;
          }
        } catch {
          // try next selector
        }
      }
      if (clicked) break;
    }

    if (!clicked) {
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      throw new Error('"Start My Day" and "End My Day" not found. See debug-screenshot.png artifact.');
    }

    // 8. Confirm
    await sleep(3000);
    const afterText = await page.innerText('body');
    if (clickedLabel === 'Start My Day' && afterText.includes('End My Day')) {
      console.log('✅ Day started successfully!');
    } else if (clickedLabel === 'End My Day' && afterText.includes('Start My Day')) {
      console.log('✅ Day ended successfully!');
    } else {
      await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
      console.warn(`⚠️  Clicked "${clickedLabel}" but state did not clearly change. Check debug-screenshot.png.`);
    }

  } finally {
    await browser.close();
  }
}

startMyDay().catch((err) => {
  console.error('Automation failed:', err.message);
  process.exit(1);
});
