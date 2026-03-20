const { defineConfig } = require('playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'node e2e/server.js',
    port: 4173,
    reuseExistingServer: true,
    timeout: 30_000
  }
});
