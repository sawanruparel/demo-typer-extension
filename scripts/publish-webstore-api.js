#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_INTERVAL_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  SUCCESSFUL_UPLOAD_STATES,
  fetchStatus,
  getAccessToken,
  getDefaultPackagePath,
  loadDotEnv,
  logInfo,
  logStep,
  parseIntegerFlag,
  publishItem,
  resolveReleaseContext,
  runBuild,
  summarizeStatus,
  uploadPackage,
  waitForPublishedVersion,
  waitForUploadCompletion
} = require('./webstore-release-lib');

function parseApiArgs(argv) {
  const options = {
    skipBuild: false,
    skipTests: false,
    packagePath: null,
    deployPercentage: null,
    skipReview: false,
    staged: false,
    waitPublished: false,
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    intervalSeconds: DEFAULT_INTERVAL_SECONDS,
    help: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--skip-build') {
      options.skipBuild = true;
      continue;
    }
    if (arg === '--skip-tests') {
      options.skipTests = true;
      continue;
    }
    if (arg === '--skip-review') {
      options.skipReview = true;
      continue;
    }
    if (arg === '--staged') {
      options.staged = true;
      continue;
    }
    if (arg === '--wait-published') {
      options.waitPublished = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--package') {
      index += 1;
      options.packagePath = argv[index] || null;
      continue;
    }
    if (arg === '--deploy-percentage') {
      index += 1;
      options.deployPercentage = parseIntegerFlag(argv[index], '--deploy-percentage');
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

  if (options.deployPercentage !== null && (options.deployPercentage < 0 || options.deployPercentage > 100)) {
    throw new Error('--deploy-percentage must be between 0 and 100');
  }

  return options;
}

function printUsage() {
  console.log(`Chrome Web Store API publish helper

Usage:
  node scripts/publish-webstore-api.js [options]

Options:
  --skip-build
  --skip-tests
  --package <path>
  --deploy-percentage <n>
  --skip-review
  --staged
  --wait-published
  --timeout-seconds <n>
  --interval-seconds <n>
  --help
`);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  loadDotEnv(projectRoot, process.env);
  const options = parseApiArgs(process.argv);

  if (options.help) {
    printUsage();
    return;
  }

  const context = resolveReleaseContext(projectRoot, process.env);

  if (!context.publisherId) {
    throw new Error('CHROME_WEBSTORE_PUBLISHER_ID is required to upload or publish.');
  }

  const accessToken = await getAccessToken(process.env);
  const packagePath = options.packagePath
    ? path.resolve(projectRoot, options.packagePath)
    : getDefaultPackagePath(projectRoot, context.expectedVersion);

  if (!options.skipBuild) {
    logStep('Building the extension package');
    runBuild(projectRoot, options.skipTests);
  }

  if (!fs.existsSync(packagePath)) {
    throw new Error(`Package not found: ${packagePath}`);
  }

  logStep('Uploading package to the Chrome Web Store');
  const uploadResponse = await uploadPackage(accessToken, context.itemName, packagePath);
  const uploadState = uploadResponse.uploadState || 'UNKNOWN';
  logInfo(`Upload state: ${uploadState}`);
  if (uploadResponse.crxVersion) {
    logInfo(`Uploaded package version: ${uploadResponse.crxVersion}`);
  }

  if (uploadResponse.crxVersion && uploadResponse.crxVersion !== context.expectedVersion) {
    throw new Error(
      `Uploaded package version ${uploadResponse.crxVersion} does not match manifest version ${context.expectedVersion}`
    );
  }

  if (!SUCCESSFUL_UPLOAD_STATES.has(uploadState)) {
    logStep('Waiting for async upload processing');
    await waitForUploadCompletion(accessToken, context.itemName, options.intervalSeconds, options.timeoutSeconds);
  }

  logStep('Submitting the uploaded package for publishing');
  const publishResponse = await publishItem(accessToken, context.itemName, options);
  logInfo(`Submission state: ${publishResponse.state}`);

  if (options.waitPublished) {
    logStep(`Waiting for version ${context.expectedVersion} to be published`);
    const finalStatus = await waitForPublishedVersion(
      accessToken,
      context.itemName,
      context.expectedVersion,
      options.intervalSeconds,
      options.timeoutSeconds
    );
    const summary = summarizeStatus(finalStatus);
    logInfo(`Published state: ${summary.publishedState}`);
    logInfo(`Published versions: ${summary.publishedVersions.join(', ') || 'none'}`);
  } else {
    logStep('Fetching latest item status');
    const latestStatus = await fetchStatus(accessToken, context.itemName);
    const summary = summarizeStatus(latestStatus);
    logInfo(`Published state: ${summary.publishedState}`);
    logInfo(`Submitted state: ${summary.submittedState}`);
    logInfo(`Published versions: ${summary.publishedVersions.join(', ') || 'none'}`);
  }

  console.log(`\nAPI release flow completed for ${context.manifest.name} ${context.expectedVersion}`);
  console.log(`Package: ${packagePath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\nAPI release failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseApiArgs
};
