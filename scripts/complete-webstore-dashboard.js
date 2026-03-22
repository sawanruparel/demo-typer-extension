#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {
  DEFAULT_DASHBOARD_URL,
  loadDotEnv,
  logInfo,
  logStep,
  resolveReleaseContext
} = require('./webstore-release-lib');

const TAB_LABELS = {
  package: ['Package'],
  'store-listing': ['Store listing', 'Listing'],
  privacy: ['Privacy'],
  distribution: ['Distribution'],
  'test-instructions': ['Test instructions', 'Test Instructions']
};

function parseDashboardArgs(argv) {
  const options = {
    profileDir: null,
    dashboardUrl: DEFAULT_DASHBOARD_URL,
    itemUrl: null,
    tab: 'store-listing',
    headless: false,
    uploadAssets: true,
    save: true,
    promptLogin: true,
    help: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--headless') {
      options.headless = true;
      continue;
    }
    if (arg === '--no-upload-assets') {
      options.uploadAssets = false;
      continue;
    }
    if (arg === '--no-save') {
      options.save = false;
      continue;
    }
    if (arg === '--no-login-prompt') {
      options.promptLogin = false;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--profile-dir') {
      index += 1;
      options.profileDir = argv[index] || null;
      continue;
    }
    if (arg === '--dashboard-url') {
      index += 1;
      options.dashboardUrl = argv[index] || null;
      continue;
    }
    if (arg === '--item-url') {
      index += 1;
      options.itemUrl = argv[index] || null;
      continue;
    }
    if (arg === '--tab') {
      index += 1;
      options.tab = argv[index] || null;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.tab && !TAB_LABELS[options.tab]) {
    throw new Error(`Unsupported tab: ${options.tab}`);
  }

  return options;
}

function printUsage() {
  console.log(`Chrome Web Store dashboard helper

Usage:
  node scripts/complete-webstore-dashboard.js [options]

Options:
  --profile-dir <path>
  --dashboard-url <url>
  --item-url <url>
  --tab <name>
  --headless
  --no-upload-assets
  --no-save
  --no-login-prompt
  --help
`);
}

function getDefaultProfileDir(projectRoot) {
  return path.join(projectRoot, '.chrome-webstore-profile');
}

function fileIfExists(filePath) {
  return fs.existsSync(filePath) ? filePath : null;
}

function getDefaultAssetPlan(projectRoot) {
  const screenshotOrder = [
    'screenshot_popup_in_context_1280x800.png',
    'screenshot_demo_page_1280x800.png',
    'screenshot_typing_active_1280x800.png',
    'screenshot_editor_context_1280x800.png',
    'screenshot_options_1280x800.png'
  ];

  return {
    screenshots: screenshotOrder
      .map((name) => fileIfExists(path.join(projectRoot, 'promo-images', name)))
      .filter(Boolean),
    smallPromo: fileIfExists(path.join(projectRoot, 'promo-images', 'small_promo_tile_440x280.png')),
    marquee: fileIfExists(path.join(projectRoot, 'promo-images', 'marquee_promo_tile_1400x560.png'))
  };
}

function askToContinue(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function clickFirstMatchingControl(page, labels) {
  for (const label of labels) {
    const button = page.getByRole('button', { name: label, exact: false }).first();
    if (await button.count()) {
      try {
        await button.click({ timeout: 3000 });
        return true;
      } catch (error) {
        // Try the next match.
      }
    }

    const link = page.getByRole('link', { name: label, exact: false }).first();
    if (await link.count()) {
      try {
        await link.click({ timeout: 3000 });
        return true;
      } catch (error) {
        // Try the next match.
      }
    }

    const textTarget = page.getByText(label, { exact: false }).first();
    if (await textTarget.count()) {
      try {
        await textTarget.click({ timeout: 3000 });
        return true;
      } catch (error) {
        // Try the next match.
      }
    }
  }

  return false;
}

async function openItemEditor(page, dashboardUrl, itemUrl, extensionId, itemName) {
  await page.goto(itemUrl || dashboardUrl, {
    waitUntil: 'domcontentloaded'
  });

  if (itemUrl) {
    return;
  }

  const directLink = page.locator(`a[href*="${extensionId}"]`).first();
  if (await directLink.count()) {
    await directLink.click();
    await page.waitForLoadState('domcontentloaded');
    return;
  }

  const nameLink = page.getByRole('link', { name: itemName, exact: false }).first();
  if (await nameLink.count()) {
    await nameLink.click();
    await page.waitForLoadState('domcontentloaded');
    return;
  }

  throw new Error(`Could not find an item card for ${itemName} (${extensionId}) in the dashboard.`);
}

async function goToTab(page, tab) {
  if (!tab) {
    return;
  }

  const labels = TAB_LABELS[tab];
  const clicked = await clickFirstMatchingControl(page, labels);
  if (!clicked) {
    throw new Error(`Could not switch to the "${tab}" tab in the dashboard.`);
  }

  await page.waitForLoadState('domcontentloaded');
}

async function findFileInputByNearbyText(page, pattern) {
  const handle = await page.evaluateHandle(({ source, flags }) => {
    const matcher = new RegExp(source, flags);
    const inputs = [...document.querySelectorAll('input[type="file"]')];
    let bestInput = null;
    let bestScore = -1;

    inputs.forEach((input) => {
      const root = input.closest('section, form, div, li') || input.parentElement || input;
      const text = (root.innerText || root.textContent || '').trim();
      const match = matcher.exec(text);
      if (match) {
        const score = Math.max(text.length - match.index, 0);
        if (score > bestScore) {
          bestInput = input;
          bestScore = score;
        }
      }
    });

    return bestInput;
  }, { source: pattern.source, flags: pattern.flags });

  return handle.asElement();
}

async function setFilesByPattern(page, pattern, files, label) {
  if (!files || (Array.isArray(files) && files.length === 0)) {
    logInfo(`Skipping ${label}: no local files were found.`);
    return false;
  }

  const input = await findFileInputByNearbyText(page, pattern);
  if (!input) {
    logInfo(`Could not find a file input for ${label}.`);
    return false;
  }

  await input.setInputFiles(files);
  await input.dispose();
  logInfo(`Uploaded ${label}.`);
  return true;
}

async function uploadStoreListingAssets(page, assetPlan) {
  await setFilesByPattern(page, /screenshots?/i, assetPlan.screenshots, 'screenshots');
  await setFilesByPattern(page, /small\s+promo|promo\s+tile/i, assetPlan.smallPromo, 'small promo tile');
  await setFilesByPattern(page, /marquee/i, assetPlan.marquee, 'marquee promo tile');
}

async function maybeSave(page) {
  const saved = await clickFirstMatchingControl(page, ['Save draft', 'Save', 'Save changes']);
  if (saved) {
    logInfo('Triggered a save action in the dashboard.');
  } else {
    logInfo('No save button was found automatically.');
  }
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  loadDotEnv(projectRoot, process.env);
  const options = parseDashboardArgs(process.argv);

  if (options.help) {
    printUsage();
    return;
  }

  const context = resolveReleaseContext(projectRoot, process.env);
  const browserProfileDir = options.profileDir
    ? path.resolve(projectRoot, options.profileDir)
    : getDefaultProfileDir(projectRoot);
  const assetPlan = getDefaultAssetPlan(projectRoot);
  const { chromium } = require('playwright');

  logStep('Launching a persistent browser profile for the Chrome Web Store dashboard');
  logInfo(`Profile directory: ${browserProfileDir}`);

  const browserContext = await chromium.launchPersistentContext(browserProfileDir, {
    headless: options.headless,
    viewport: { width: 1440, height: 1100 }
  });

  try {
    const page = browserContext.pages()[0] || await browserContext.newPage();
    await openItemEditor(page, options.dashboardUrl, options.itemUrl, context.extensionId, context.manifest.name);

    if (options.promptLogin) {
      console.log('\nFinish any Google login or 2-step verification in the browser, then press Enter here to continue.');
      await askToContinue('Press Enter to continue...');
      await openItemEditor(page, options.dashboardUrl, options.itemUrl, context.extensionId, context.manifest.name);
    }

    logStep('Opening the requested dashboard tab');
    await goToTab(page, options.tab);
    logInfo(`Current page: ${page.url()}`);

    if (options.uploadAssets && options.tab === 'store-listing') {
      logStep('Attempting best-effort asset uploads on the Store listing tab');
      await uploadStoreListingAssets(page, assetPlan);
    }

    if (options.save) {
      logStep('Attempting a best-effort save');
      await maybeSave(page);
    }

    console.log('\nDashboard helper finished. The browser profile remains on disk so you can reuse your login next time.');
    console.log(`Profile path: ${browserProfileDir}`);
  } finally {
    await browserContext.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\nDashboard automation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  getDefaultAssetPlan,
  getDefaultProfileDir,
  parseDashboardArgs
};
