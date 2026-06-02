const { chromium } = require('playwright');

const START_SELECTORS = [
  'text="Start My Day"',
  ':text("Start My Day")',
  'button:has-text("Start My Day")',
  'div:has-text("Start My Day")',
  'span:has-text("Start My Day")',
  '[aria-label*="Start My Day" i]',
];

const END_SELECTORS = [
  'text="End My Day"',
  ':text("End My Day")',
  'button:has-text("End My Day")',
  'div:has-text("End My Day")',
  'span:has-text("End My Day")',
  '[aria-label*="End My Day" i]',
];

const MAX_CLICK_ATTEMPTS = 10;
const WAIT_AFTER_CLICK_MS = 2500;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isVisible(page, selectors) {
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0 && (await el.isVisible())) {
        return true;
      }
    } catch {
      // try next
    }
  }
  return false;
}

async function clickStartMyDay(page) {
  for (const selector of START_SELECTORS) {
    try {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0) {
        await el.scrollIntoViewIfNeeded();
        await el.waitFor({ state: 'visible', timeout: 5000 });
        await el.click({ timeout: 5000 });
        console.log(`Clicked Start My Day circle (selector: ${selector})`);
        return true;
      }
    } catch {
      // try next
    }
  }
  return false;
}

async function tryDismissConfirm(page) {
  const confirmSelectors = [
    'button:has-text("OK")',
    'button:has-text("Ok")',
    'button:has-text("Yes")',
    'button:has-text("Confirm")',
    'button:has-text("Continue")',
  ];
  for (const selector of confirmSelectors) {
    try {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0 && (await el.isVisible())) {
        await el.click();
        console.log(`Confirmed dialog (${selector})`);
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

async function isClockedIn(page) {
  return isVisible(page, END_SELECTORS);
}

async function clickStartUntilEndMyDay(page) {
  if (await isClockedIn(page)) {
    const startStillVisible = await isVisible(page, START_SELECTORS);
    if (!startStillVisible) {
      console.log('Already clocked in — "End My Day" is showing. Nothing to click.');
      return;
    }
  }

  console.log('Will keep clicking "Start My Day" until "End My Day" appears...');

  for (let attempt = 1; attempt <= MAX_CLICK_ATTEMPTS; attempt++) {
    if (await isClockedIn(page)) {
      console.log(`✅ "End My Day" is now showing (after ${attempt} attempt(s)).`);
      return;
    }

    const clicked = await clickStartMyDay(page);
    if (!clicked) {
      console.log(`Attempt ${attempt}: Start My Day circle not found or not clickable.`);
    }

    await sleep(WAIT_AFTER_CLICK_MS);
    await tryDismissConfirm(page);
    await sleep(1000);

    if (await isClockedIn(page)) {
      console.log(`✅ "End My Day" is now showing (after ${attempt} click(s)).`);
      return;
    }

    console.log(`Attempt ${attempt}/${MAX_CLICK_ATTEMPTS}: still not "End My Day". Clicking again...`);
  }

  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  throw new Error(
    `Clicked "Start My Day" ${MAX_CLICK_ATTEMPTS} times but "End My Day" never appeared. See debug-screenshot.png.`
  );
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
    launchOptions.proxy = { server: proxyServer };
    if (proxyUsername) launchOptions.proxy.username = proxyUsername;
    if (proxyPassword) launchOptions.proxy.password = proxyPassword;
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
    console.log('Navigating to Time Capture (will redirect to login)...');
    await page.goto('https://app.myhcm.pk/ontime/timecapture', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('Filling credentials...');
    await page.waitForSelector('input[type="text"], input[name="Username"], input[id="Username"]', {
      timeout: 15000,
    });
    await page.fill('input[type="text"], input[name="Username"], input[id="Username"]', username);
    await page.fill('input[type="password"], input[name="Password"], input[id="Password"]', password);
    console.log('Credentials entered.');

    await page.click(
      'button[type="submit"], input[type="submit"], button:has-text("SIGN IN"), button:has-text("Sign in")'
    );
    console.log('Sign in clicked. Waiting for Time Capture page...');

    await page.waitForURL('**/ontime/timecapture**', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('On Time Capture page.');

    await sleep(3000);
    await clickStartUntilEndMyDay(page);
  } finally {
    await browser.close();
  }
}

startMyDay().catch((err) => {
  console.error('Automation failed:', err.message);
  process.exit(1);
});
