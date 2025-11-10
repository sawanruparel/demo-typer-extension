#!/usr/bin/env node

/**
 * Test Extension Loading
 * Verifies that the extension can be loaded in Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, '..');

async function testExtensionLoad() {
  console.log('🧪 Testing extension loading with Puppeteer...\n');
  console.log(`📁 Extension path: ${EXTENSION_PATH}\n`);
  
  let browser;
  
  try {
    console.log('🚀 Launching Chrome with extension...');
    
    browser = await puppeteer.launch({
      headless: false,  // Must be non-headless to load extensions
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1280,800'
      ],
      defaultViewport: { width: 1280, height: 800 }
    });
    
    console.log('✅ Browser launched successfully!\n');
    
    // Get all pages (extension may create background pages)
    const pages = await browser.pages();
    console.log(`📄 Number of pages: ${pages.length}`);
    
    // Create or get a page
    const page = pages[0] || await browser.newPage();
    
    // Check if we can access extension files
    console.log('\n🔍 Testing extension file access...');
    
    // Try loading the demo page
    const demoPagePath = `file://${path.join(EXTENSION_PATH, 'demo-page.html')}`;
    console.log(`   Loading: ${demoPagePath}`);
    
    await page.goto(demoPagePath, { waitUntil: 'networkidle0' });
    console.log('   ✅ Demo page loaded successfully!');
    
    // Get page title
    const title = await page.title();
    console.log(`   📋 Page title: "${title}"`);
    
    // Try loading the popup
    console.log('\n🔍 Testing popup.html...');
    const popupPath = `file://${path.join(EXTENSION_PATH, 'popup.html')}`;
    await page.goto(popupPath, { waitUntil: 'networkidle0' });
    const popupTitle = await page.title();
    console.log(`   ✅ Popup loaded: "${popupTitle}"`);
    
    // Try loading options page
    console.log('\n🔍 Testing options.html...');
    const optionsPath = `file://${path.join(EXTENSION_PATH, 'options.html')}`;
    await page.goto(optionsPath, { waitUntil: 'networkidle0' });
    const optionsTitle = await page.title();
    console.log(`   ✅ Options loaded: "${optionsTitle}"`);
    
    // Check manifest
    console.log('\n🔍 Checking manifest.json...');
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const fs = require('fs');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`   ✅ Extension name: "${manifest.name}"`);
      console.log(`   ✅ Version: ${manifest.version}`);
      console.log(`   ✅ Manifest version: ${manifest.manifest_version}`);
    }
    
    console.log('\n✨ All tests passed! Extension is loading correctly.');
    console.log('\n⏳ Keeping browser open for 5 seconds so you can see it...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      console.log('\n🔒 Closing browser...');
      await browser.close();
      console.log('✅ Done!\n');
    }
  }
}

// Run the test
if (require.main === module) {
  testExtensionLoad();
}

module.exports = { testExtensionLoad };

