const { chromium } = require('playwright');

const ACTIONS = [
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

const MAX_CLICK_ATTEMPTS = 8;
const WAIT_AFTER_CLICK_MS = 2500;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isActionVisible(page, label) {
  const action = ACTIONS.find((a) => a.label === label);
  if (!action) return false;

  for (const selector of action.selectors) {
    try {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0 && (await el.isVisible())) {
        return true;
      }
    } catch {
      // try next selector
    }
  }
  return false;
}

async function clickAction(page, label) {
  const action = ACTIONS.find((a) => a.label === label);
  if (!action) return false;

  for (const selector of action.selectors) {
    try {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0) {
        await el.scrollIntoViewIfNeeded();
        await el.waitFor({ state: 'visible', timeout: 5000 });
        await el.click({ timeout: 5000 });
        console.log(`Clicked "${label}" (selector: ${selector})`);
        return true;
      }
    } catch {
      // try next selector
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

function oppositeLabel(label) {
  return label === 'Start My Day' ? 'End My Day' : 'Start My Day';
}

function stateChanged(clickedLabel, startVisible, endVisible) {
  if (clickedLabel === 'Start My Day') {
    return endVisible && !startVisible;
  }
  return startVisible && !endVisible;
}

async function pickActionToClick(page) {
  const startVisible = await isActionVisible(page, 'Start My Day');
  const endVisible = await isActionVisible(page, 'End My Day');

  if (startVisible) return 'Start My Day';
  if (endVisible) return 'End My Day';
  return null;
}

async function clickUntilStateChange(page) {
  const labelToClick = await pickActionToClick(page);
  if (!labelToClick) {
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    throw new Error('"Start My Day" and "End My Day" not found. See debug-screenshot.png.');
  }

  const expectedAfter = oppositeLabel(labelToClick);
  console.log(
    `Action visible: "${labelToClick}". Will click until "${expectedAfter}" is the active state.`
  );

  for (let attempt = 1; attempt <= MAX_CLICK_ATTEMPTS; attempt++) {
    const stillThere = await isActionVisible(page, labelToClick);
    if (!stillThere) {
      const oppositeVisible = await isActionVisible(page, expectedAfter);
      if (oppositeVisible) {
        console.log(`✅ State changed to "${expectedAfter}" (attempt ${attempt}).`);
        return { clickedLabel: labelToClick, success: true };
      }
    }

    const clicked = await clickAction(page, labelToClick);
    if (!clicked) {
      console.log(`Attempt ${attempt}: "${labelToClick}" not clickable, re-checking state...`);
    }

    await sleep(WAIT_AFTER_CLICK_MS);
    await tryDismissConfirm(page);
    await sleep(1000);

    const startVisible = await isActionVisible(page, 'Start My Day');
    const endVisible = await isActionVisible(page, 'End My Day');

    if (stateChanged(labelToClick, startVisible, endVisible)) {
      console.log(
        `✅ State changed after clicking "${labelToClick}" → now showing "${expectedAfter}" (attempt ${attempt}).`
      );
      return { clickedLabel: labelToClick, success: true };
    }

    console.log(
      `Attempt ${attempt}/${MAX_CLICK_ATTEMPTS}: state unchanged (Start visible: ${startVisible}, End visible: ${endVisible}). Retrying...`
    );
  }

  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  throw new Error(
    `Clicked "${labelToClick}" ${MAX_CLICK_ATTEMPTS} times but state did not change to "${expectedAfter}". See debug-screenshot.png.`
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
    await clickUntilStateChange(page);
  } finally {
    await browser.close();
  }
}

startMyDay().catch((err) => {
  console.error('Automation failed:', err.message);
  process.exit(1);
});
