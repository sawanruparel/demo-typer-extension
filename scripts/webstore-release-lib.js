const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_EXTENSION_ID = 'jhmaebpcljoabnanhifemljjpdlllapp';
const DEFAULT_DASHBOARD_URL = 'https://chrome.google.com/webstore/devconsole';
const TOKEN_SCOPE = 'https://www.googleapis.com/auth/chromewebstore';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const WEBSTORE_API_BASE = 'https://chromewebstore.googleapis.com';
const DEFAULT_TIMEOUT_SECONDS = 900;
const DEFAULT_INTERVAL_SECONDS = 15;
const SUCCESSFUL_UPLOAD_STATES = new Set(['SUCCEEDED']);
const FAILED_UPLOAD_STATES = new Set(['FAILED']);
const SUCCESSFUL_ITEM_STATES = new Set(['PUBLISHED']);
const FAILED_ITEM_STATES = new Set(['REJECTED', 'CANCELLED']);
const ENV_FILE_NAME = '.env';

function parseIntegerFlag(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${flagName} requires an integer value`);
  }
  return parsed;
}

function stripWrappingQuotes(value) {
  if (!value) {
    return value;
  }

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value[value.length - 1] === quote) {
    return value.slice(1, -1);
  }

  return value;
}

function parseDotEnv(contents) {
  const parsed = {};
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    parsed[key] = stripWrappingQuotes(rawValue);
  }

  return parsed;
}

function loadDotEnv(projectRoot, env) {
  const envFilePath = path.join(projectRoot, ENV_FILE_NAME);

  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const fileValues = parseDotEnv(fs.readFileSync(envFilePath, 'utf8'));

  Object.entries(fileValues).forEach(([key, value]) => {
    if (env[key] === undefined) {
      env[key] = value;
    }
  });
}

function readManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function buildStoreUrl(extensionId) {
  return `https://chromewebstore.google.com/detail/${extensionId}`;
}

function getDefaultPackagePath(projectRoot, version) {
  return path.join(projectRoot, `demo-typer-v${version}.zip`);
}

function buildItemName(publisherId, extensionId) {
  return `publishers/${publisherId}/items/${extensionId}`;
}

function normalizePrivateKey(privateKey) {
  return privateKey.replace(/\\n/g, '\n');
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createServiceAccountJwt(clientEmail, privateKey) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const payload = {
    iss: clientEmail,
    scope: TOKEN_SCOPE,
    aud: TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .end()
    .sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${unsignedToken}.${signature}`;
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function logStep(message) {
  console.log(`\n==> ${message}`);
}

function logInfo(message) {
  console.log(`    ${message}`);
}

function httpRequest(options, redirectCount = 0) {
  const url = new URL(options.url);
  const transport = url.protocol === 'http:' ? http : https;
  const headers = Object.assign({}, options.headers);
  const body = options.body;

  if (body && !headers['Content-Length']) {
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: options.method || 'GET',
        headers
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const responseBody = Buffer.concat(chunks);
          const isRedirect =
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location;

          if (isRedirect) {
            if (redirectCount >= 5) {
              reject(new Error(`Too many redirects while fetching ${options.url}`));
              return;
            }

            const redirectUrl = new URL(response.headers.location, options.url).toString();
            resolve(httpRequest(Object.assign({}, options, { url: redirectUrl }), redirectCount + 1));
            return;
          }

          resolve({
            statusCode: response.statusCode || 0,
            headers: response.headers,
            body: responseBody,
            text: responseBody.toString('utf8'),
            url: options.url
          });
        });
      }
    );

    request.on('error', reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function requestJson(options) {
  const response = await httpRequest(options);
  const text = response.text.trim();
  const data = text ? JSON.parse(text) : null;

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const errorMessage = data && data.error ? JSON.stringify(data.error) : text || `HTTP ${response.statusCode}`;
    throw new Error(errorMessage);
  }

  return data;
}

async function exchangeServiceAccountForAccessToken(serviceAccount) {
  const assertion = createServiceAccountJwt(serviceAccount.client_email, normalizePrivateKey(serviceAccount.private_key));
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  }).toString();
  const response = await requestJson({
    url: TOKEN_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  return response.access_token;
}

async function exchangeRefreshTokenForAccessToken(env) {
  const body = new URLSearchParams({
    client_id: env.CHROME_WEBSTORE_CLIENT_ID,
    client_secret: env.CHROME_WEBSTORE_CLIENT_SECRET,
    refresh_token: env.CHROME_WEBSTORE_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  }).toString();
  const response = await requestJson({
    url: TOKEN_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  return response.access_token;
}

function loadServiceAccount(env) {
  const rawJson =
    env.CHROME_WEBSTORE_SERVICE_ACCOUNT_JSON ||
    (env.CHROME_WEBSTORE_SERVICE_ACCOUNT_JSON_PATH && fs.readFileSync(env.CHROME_WEBSTORE_SERVICE_ACCOUNT_JSON_PATH, 'utf8')) ||
    (env.GOOGLE_APPLICATION_CREDENTIALS && fs.readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));

  if (rawJson) {
    return JSON.parse(rawJson);
  }

  if (env.CHROME_WEBSTORE_CLIENT_EMAIL && env.CHROME_WEBSTORE_PRIVATE_KEY) {
    return {
      client_email: env.CHROME_WEBSTORE_CLIENT_EMAIL,
      private_key: env.CHROME_WEBSTORE_PRIVATE_KEY
    };
  }

  return null;
}

async function getAccessToken(env) {
  if (env.CHROME_WEBSTORE_ACCESS_TOKEN) {
    return env.CHROME_WEBSTORE_ACCESS_TOKEN;
  }

  const serviceAccount = loadServiceAccount(env);
  if (serviceAccount) {
    return exchangeServiceAccountForAccessToken(serviceAccount);
  }

  if (
    env.CHROME_WEBSTORE_CLIENT_ID &&
    env.CHROME_WEBSTORE_CLIENT_SECRET &&
    env.CHROME_WEBSTORE_REFRESH_TOKEN
  ) {
    return exchangeRefreshTokenForAccessToken(env);
  }

  throw new Error(
    'Missing Chrome Web Store credentials. Provide CHROME_WEBSTORE_ACCESS_TOKEN, a service account, or OAuth refresh-token credentials.'
  );
}

function createAuthorizedHeaders(accessToken, extraHeaders) {
  return Object.assign(
    {
      Authorization: `Bearer ${accessToken}`
    },
    extraHeaders || {}
  );
}

function getPublishedVersions(status) {
  const channels = (((status || {}).publishedItemRevisionStatus || {}).distributionChannels) || [];
  return channels
    .map((channel) => channel.crxVersion)
    .filter(Boolean);
}

function getPublishedState(status) {
  return ((status || {}).publishedItemRevisionStatus || {}).state || null;
}

function getSubmittedState(status) {
  return ((status || {}).submittedItemRevisionStatus || {}).state || null;
}

function extractStorePageMetadata(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
  return {
    title: titleMatch ? titleMatch[1] : null,
    canonicalUrl: canonicalMatch ? canonicalMatch[1] : null
  };
}

function summarizeStatus(status) {
  const publishedVersions = getPublishedVersions(status);
  return {
    uploadState: status.lastAsyncUploadState || 'UNKNOWN',
    publishedState: getPublishedState(status) || 'NONE',
    publishedVersions,
    submittedState: getSubmittedState(status) || 'NONE',
    warned: Boolean(status.warned),
    takenDown: Boolean(status.takenDown)
  };
}

async function uploadPackage(accessToken, itemName, packagePath) {
  const packageBuffer = fs.readFileSync(packagePath);
  const extension = path.extname(packagePath).toLowerCase();
  const contentType = extension === '.crx' ? 'application/x-chrome-extension' : 'application/zip';

  return requestJson({
    url: `${WEBSTORE_API_BASE}/upload/v2/${itemName}:upload?uploadType=media`,
    method: 'POST',
    headers: createAuthorizedHeaders(accessToken, {
      'Content-Type': contentType
    }),
    body: packageBuffer
  });
}

async function fetchStatus(accessToken, itemName) {
  return requestJson({
    url: `${WEBSTORE_API_BASE}/v2/${itemName}:fetchStatus`,
    method: 'GET',
    headers: createAuthorizedHeaders(accessToken)
  });
}

async function publishItem(accessToken, itemName, options) {
  const body = {};

  if (options.skipReview) {
    body.skipReview = true;
  }

  if (options.staged) {
    body.publishType = 'STAGED_PUBLISH';
  }

  if (options.deployPercentage !== null) {
    body.deployInfos = [{ deployPercentage: options.deployPercentage }];
  }

  return requestJson({
    url: `${WEBSTORE_API_BASE}/v2/${itemName}:publish`,
    method: 'POST',
    headers: createAuthorizedHeaders(accessToken, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(body)
  });
}

async function waitForUploadCompletion(accessToken, itemName, intervalSeconds, timeoutSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() <= deadline) {
    const status = await fetchStatus(accessToken, itemName);
    const uploadState = status.lastAsyncUploadState || 'UNKNOWN';

    logInfo(`Upload state: ${uploadState}`);

    if (SUCCESSFUL_UPLOAD_STATES.has(uploadState)) {
      return status;
    }

    if (FAILED_UPLOAD_STATES.has(uploadState)) {
      throw new Error('Chrome Web Store reported that the upload failed.');
    }

    await sleep(intervalSeconds * 1000);
  }

  throw new Error(`Timed out after ${timeoutSeconds}s while waiting for the upload to finish.`);
}

async function waitForPublishedVersion(accessToken, itemName, expectedVersion, intervalSeconds, timeoutSeconds) {
  const deadline = Date.now() + timeoutSeconds * 1000;

  while (Date.now() <= deadline) {
    const status = await fetchStatus(accessToken, itemName);
    const publishedState = getPublishedState(status);
    const submittedState = getSubmittedState(status);
    const publishedVersions = getPublishedVersions(status);

    logInfo(
      `Submitted state: ${submittedState || 'NONE'} | Published state: ${publishedState || 'NONE'} | Published versions: ${publishedVersions.join(', ') || 'none'}`
    );

    if (FAILED_ITEM_STATES.has(submittedState) || FAILED_ITEM_STATES.has(publishedState)) {
      throw new Error(`Chrome Web Store reported a failed submission state: ${submittedState || publishedState}`);
    }

    if (SUCCESSFUL_ITEM_STATES.has(publishedState) && publishedVersions.includes(expectedVersion)) {
      return status;
    }

    await sleep(intervalSeconds * 1000);
  }

  const latestStatus = await fetchStatus(accessToken, itemName);
  const summary = summarizeStatus(latestStatus);

  throw new Error(
    `Timed out after ${timeoutSeconds}s waiting for version ${expectedVersion} to go live. ` +
      `Published state: ${summary.publishedState}. Published versions: ${summary.publishedVersions.join(', ') || 'none'}. ` +
      `Submitted state: ${summary.submittedState}.`
  );
}

async function validatePublicListing(storeUrl, extensionId, expectedName) {
  const response = await httpRequest({
    url: storeUrl,
    method: 'GET'
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Public store page returned HTTP ${response.statusCode}`);
  }

  const metadata = extractStorePageMetadata(response.text);

  if (!metadata.title || !metadata.title.includes(expectedName)) {
    throw new Error(`Public store page title did not include "${expectedName}"`);
  }

  if (!metadata.canonicalUrl || !metadata.canonicalUrl.includes(`/${extensionId}`)) {
    throw new Error('Public store page canonical URL did not include the extension id');
  }

  return metadata;
}

function runBuild(projectRoot, skipTests) {
  const buildResult = spawnSync('./build.sh', [], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: Object.assign({}, process.env, skipTests ? { BUILD_SKIP_TEST: '1' } : {})
  });

  if (buildResult.status !== 0) {
    throw new Error(`build.sh exited with status ${buildResult.status}`);
  }
}

function maybeOpenBrowser(url) {
  const commands =
    process.platform === 'darwin'
      ? [['open', [url]]]
      : process.platform === 'win32'
        ? [['cmd', ['/c', 'start', '', url]]]
        : [['xdg-open', [url]]];

  for (const [command, args] of commands) {
    const result = spawnSync(command, args, {
      stdio: 'ignore'
    });

    if (!result.error && result.status === 0) {
      return true;
    }
  }

  return false;
}

function resolveReleaseContext(projectRoot, env, cliStoreUrl) {
  const manifest = readManifest(projectRoot);
  const extensionId = env.CHROME_WEBSTORE_EXTENSION_ID || DEFAULT_EXTENSION_ID;
  const publisherId = env.CHROME_WEBSTORE_PUBLISHER_ID;
  const itemName = publisherId ? buildItemName(publisherId, extensionId) : null;
  const storeUrl = cliStoreUrl || env.CHROME_WEBSTORE_STORE_URL || buildStoreUrl(extensionId);

  return {
    manifest,
    extensionId,
    publisherId,
    itemName,
    storeUrl,
    expectedVersion: manifest.version
  };
}

module.exports = {
  DEFAULT_DASHBOARD_URL,
  DEFAULT_EXTENSION_ID,
  DEFAULT_INTERVAL_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  buildItemName,
  buildStoreUrl,
  extractStorePageMetadata,
  fetchStatus,
  getAccessToken,
  getDefaultPackagePath,
  getPublishedVersions,
  httpRequest,
  loadDotEnv,
  logInfo,
  logStep,
  maybeOpenBrowser,
  normalizePrivateKey,
  parseDotEnv,
  parseIntegerFlag,
  publishItem,
  readManifest,
  resolveReleaseContext,
  runBuild,
  stripWrappingQuotes,
  summarizeStatus,
  uploadPackage,
  validatePublicListing,
  waitForPublishedVersion,
  waitForUploadCompletion,
  SUCCESSFUL_UPLOAD_STATES
};
