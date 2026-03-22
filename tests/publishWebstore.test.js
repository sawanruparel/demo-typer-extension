const {
  buildItemName,
  buildStoreUrl,
  extractStorePageMetadata,
  getPublishedVersions,
  normalizePrivateKey,
  parseDotEnv,
  stripWrappingQuotes
} = require('../scripts/webstore-release-lib');
const { parseApiArgs } = require('../scripts/publish-webstore-api');
const { parseDashboardArgs, getDefaultProfileDir } = require('../scripts/complete-webstore-dashboard');
const { parseVerifyArgs } = require('../scripts/verify-webstore-public');

describe('publish-webstore helpers', () => {
  test('parses CLI flags', () => {
    const options = parseApiArgs([
      'node',
      'scripts/publish-webstore-api.js',
      '--skip-build',
      '--skip-tests',
      '--deploy-percentage',
      '25',
      '--timeout-seconds',
      '120',
      '--interval-seconds',
      '5',
      '--package',
      'build/demo.zip'
    ]);

    expect(options.skipBuild).toBe(true);
    expect(options.skipTests).toBe(true);
    expect(options.deployPercentage).toBe(25);
    expect(options.timeoutSeconds).toBe(120);
    expect(options.intervalSeconds).toBe(5);
    expect(options.packagePath).toBe('build/demo.zip');
  });

  test('parses dashboard helper flags', () => {
    const options = parseDashboardArgs([
      'node',
      'scripts/complete-webstore-dashboard.js',
      '--profile-dir',
      '.custom-profile',
      '--tab',
      'privacy',
      '--no-upload-assets',
      '--no-save',
      '--headless'
    ]);

    expect(options.profileDir).toBe('.custom-profile');
    expect(options.tab).toBe('privacy');
    expect(options.uploadAssets).toBe(false);
    expect(options.save).toBe(false);
    expect(options.headless).toBe(true);
  });

  test('parses public verifier flags', () => {
    const options = parseVerifyArgs([
      'node',
      'scripts/verify-webstore-public.js',
      '--wait-live',
      '--store-url',
      'https://chromewebstore.google.com/detail/example/abcd',
      '--open'
    ]);

    expect(options.waitLive).toBe(true);
    expect(options.storeUrl).toBe('https://chromewebstore.google.com/detail/example/abcd');
    expect(options.open).toBe(true);
  });

  test('builds Chrome Web Store paths', () => {
    expect(buildItemName('publisher-123', 'extension-456')).toBe('publishers/publisher-123/items/extension-456');
    expect(buildStoreUrl('extension-456')).toBe('https://chromewebstore.google.com/detail/extension-456');
  });

  test('extracts public listing metadata from HTML', () => {
    const metadata = extractStorePageMetadata(
      '<title>Demo Typer - Realistic Typing Simulator - Chrome Web Store</title>' +
        '<link rel="canonical" href="https://chromewebstore.google.com/detail/demo-typer/jhmaebpcljoabnanhifemljjpdlllapp">'
    );

    expect(metadata.title).toContain('Demo Typer');
    expect(metadata.canonicalUrl).toContain('/jhmaebpcljoabnanhifemljjpdlllapp');
  });

  test('reads published versions from status payloads', () => {
    const versions = getPublishedVersions({
      publishedItemRevisionStatus: {
        distributionChannels: [
          { crxVersion: '1.0.1' },
          { crxVersion: '1.0.0' }
        ]
      }
    });

    expect(versions).toEqual(['1.0.1', '1.0.0']);
  });

  test('normalizes escaped private keys', () => {
    expect(normalizePrivateKey('line1\\nline2')).toBe('line1\nline2');
  });

  test('strips wrapping quotes from dotenv values', () => {
    expect(stripWrappingQuotes('"quoted"')).toBe('quoted');
    expect(stripWrappingQuotes("'single-quoted'")).toBe('single-quoted');
    expect(stripWrappingQuotes('plain')).toBe('plain');
  });

  test('parses dotenv files', () => {
    const parsed = parseDotEnv(`
# comment
CHROME_WEBSTORE_PUBLISHER_ID=acae06af-581f-4e52-b485-5dce55ab691f
CHROME_WEBSTORE_STORE_URL="https://chromewebstore.google.com/detail/jhmaebpcljoabnanhifemljjpdlllapp"
CHROME_WEBSTORE_CLIENT_EMAIL='bot@example.com'
`);

    expect(parsed.CHROME_WEBSTORE_PUBLISHER_ID).toBe('acae06af-581f-4e52-b485-5dce55ab691f');
    expect(parsed.CHROME_WEBSTORE_STORE_URL).toBe(
      'https://chromewebstore.google.com/detail/jhmaebpcljoabnanhifemljjpdlllapp'
    );
    expect(parsed.CHROME_WEBSTORE_CLIENT_EMAIL).toBe('bot@example.com');
  });

  test('uses a stable default dashboard profile directory', () => {
    expect(getDefaultProfileDir('/tmp/demo-typer-extension')).toBe('/tmp/demo-typer-extension/.chrome-webstore-profile');
  });
});
