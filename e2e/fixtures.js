const fs = require('fs');
const os = require('os');
const path = require('path');
const { test: base, expect, chromium } = require('playwright/test');

const SOURCE_EXTENSION_PATH = path.resolve(__dirname, '..');
const E2E_BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

function stageExtensionForE2E() {
  const stagedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-typer-extension-'));
  const filesToCopy = [
    'background.js',
    'contentScript.js',
    'popup.html',
    'popup.js',
    'options.html',
    'demo-page.html'
  ];

  for (const file of filesToCopy) {
    fs.copyFileSync(
      path.join(SOURCE_EXTENSION_PATH, file),
      path.join(stagedDir, file)
    );
  }

  fs.cpSync(
    path.join(SOURCE_EXTENSION_PATH, 'icons'),
    path.join(stagedDir, 'icons'),
    { recursive: true }
  );

  const manifestPath = path.join(SOURCE_EXTENSION_PATH, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.host_permissions = ['http://127.0.0.1/*'];
  fs.writeFileSync(
    path.join(stagedDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  return stagedDir;
}

async function openExtensionPage(context, extensionId, pagePath) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${pagePath}`);
  return page;
}

const test = base.extend({
  context: async ({}, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-typer-e2e-'));
    const extensionPath = stageExtensionForE2E();
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: false,
      viewport: { width: 1440, height: 1000 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    try {
      await use(context);
    } finally {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
      fs.rmSync(extensionPath, { recursive: true, force: true });
    }
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    try {
      await use(page);
    } finally {
      await page.close();
    }
  },

  serviceWorker: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    const deadline = Date.now() + 30_000;

    while (!serviceWorker && Date.now() < deadline) {
      try {
        serviceWorker = await context.waitForEvent('serviceworker', { timeout: 1_000 });
      } catch (error) {
        [serviceWorker] = context.serviceWorkers();
      }
    }

    if (!serviceWorker) {
      throw new Error('Timed out waiting for the extension service worker to start.');
    }

    await use(serviceWorker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    const extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },

  demoPageUrl: async ({}, use) => {
    await use(`${E2E_BASE_URL}/demo-page.html`);
  },

  setExtensionStorage: async ({ serviceWorker }, use) => {
    await use(async (values) => {
      await serviceWorker.evaluate(async (storageValues) => {
        await chrome.storage.local.set(storageValues);
      }, values);
    });
  },

  openPopupPage: async ({ context, extensionId }, use) => {
    await use(async () => openExtensionPage(context, extensionId, 'popup.html'));
  },

  openOptionsPage: async ({ context, extensionId }, use) => {
    await use(async () => openExtensionPage(context, extensionId, 'options.html'));
  },

  runExtensionCommand: async ({ serviceWorker }, use) => {
    await use(async (command, targetUrl) => {
      return serviceWorker.evaluate(async ({ commandName, pageUrl }) => {
        return globalThis.__DEMO_TYPER_TEST_API.handleCommand(commandName, { url: pageUrl });
      }, { commandName: command, pageUrl: targetUrl });
    });
  }
});

module.exports = {
  test,
  expect
};
