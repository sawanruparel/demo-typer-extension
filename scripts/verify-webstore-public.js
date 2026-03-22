#!/usr/bin/env node

const path = require('path');
const {
  DEFAULT_INTERVAL_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  fetchStatus,
  getAccessToken,
  loadDotEnv,
  logInfo,
  logStep,
  maybeOpenBrowser,
  parseIntegerFlag,
  resolveReleaseContext,
  summarizeStatus,
  validatePublicListing,
  waitForPublishedVersion
} = require('./webstore-release-lib');

function parseVerifyArgs(argv) {
  const options = {
    open: false,
    storeUrl: null,
    waitLive: false,
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    intervalSeconds: DEFAULT_INTERVAL_SECONDS,
    help: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--open') {
      options.open = true;
      continue;
    }
    if (arg === '--wait-live') {
      options.waitLive = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--store-url') {
      index += 1;
      options.storeUrl = argv[index] || null;
      continue;
    }
    if (arg === '--timeout-seconds') {
      index += 1;
      options.timeoutSeconds = parseIntegerFlag(argv[index], '--timeout-seconds');
      continue;
    }
    if (arg === '--interval-seconds') {
      index += 1;
      options.intervalSeconds = parseIntegerFlag(argv[index], '--interval-seconds');
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log(`Chrome Web Store public listing verifier

Usage:
  node scripts/verify-webstore-public.js [options]

Options:
  --store-url <url>
  --wait-live
  --timeout-seconds <n>
  --interval-seconds <n>
  --open
  --help
`);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  loadDotEnv(projectRoot, process.env);
  const options = parseVerifyArgs(process.argv);

  if (options.help) {
    printUsage();
    return;
  }

  const context = resolveReleaseContext(projectRoot, process.env, options.storeUrl);
  let versionVerified = false;
  let accessToken = null;
  let accessTokenError = null;

  try {
    accessToken = await getAccessToken(process.env);
  } catch (error) {
    accessTokenError = error;
  }

  if (options.waitLive) {
    if (!context.publisherId) {
      throw new Error('CHROME_WEBSTORE_PUBLISHER_ID is required when using --wait-live.');
    }
    if (accessTokenError) {
      throw accessTokenError;
    }

    logStep(`Waiting for version ${context.expectedVersion} to be published`);
    const status = await waitForPublishedVersion(
      accessToken,
      context.itemName,
      context.expectedVersion,
      options.intervalSeconds,
      options.timeoutSeconds
    );
    const summary = summarizeStatus(status);
    logInfo(`Published versions: ${summary.publishedVersions.join(', ') || 'none'}`);
    versionVerified = true;
  } else if (!accessTokenError && context.publisherId) {
    logStep('Checking Chrome Web Store API status');
    const status = await fetchStatus(accessToken, context.itemName);
    const summary = summarizeStatus(status);
    logInfo(`Published state: ${summary.publishedState}`);
    logInfo(`Published versions: ${summary.publishedVersions.join(', ') || 'none'}`);

    if (summary.publishedVersions.includes(context.expectedVersion)) {
      versionVerified = true;
    }
  } else if (accessTokenError) {
    logInfo(`Skipping authenticated status checks: ${accessTokenError.message}`);
  } else {
    logInfo('Skipping authenticated status checks: CHROME_WEBSTORE_PUBLISHER_ID was not provided.');
  }

  logStep('Validating the public Chrome Web Store page');
  const metadata = await validatePublicListing(context.storeUrl, context.extensionId, context.manifest.name);
  logInfo(`Page title: ${metadata.title}`);
  logInfo(`Canonical URL: ${metadata.canonicalUrl}`);

  if (options.open) {
    const opened = maybeOpenBrowser(context.storeUrl);
    logInfo(opened ? 'Opened the public listing in the default browser.' : 'Could not open the default browser automatically.');
  }

  if (versionVerified) {
    console.log(`\nPublic listing verification succeeded for ${context.manifest.name} ${context.expectedVersion}`);
  } else {
    console.log(`\nPublic page verification succeeded for ${context.manifest.name}`);
    console.log(`Version ${context.expectedVersion} was not confirmed as live through the API.`);
  }
  console.log(`Public URL: ${context.storeUrl}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\nPublic verification failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseVerifyArgs
};
