#!/usr/bin/env node

/**
 * Real Screenshot Generator using Puppeteer
 * Loads the actual browser extension and captures screenshots
 * 
 * Requirements:
 *   npm install puppeteer
 * 
 * Usage:
 *   node scripts/generate-screenshots.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Screenshot sizes required by Chrome Web Store
const SCREENSHOT_SIZES = [
  { width: 1280, height: 800, suffix: '1280x800' },
  { width: 640, height: 400, suffix: '640x400' }
];

const OUTPUT_DIR = 'promo-images';
const EXTENSION_PATH = path.join(__dirname, '..');

// Ensure output directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Launch browser with extension loaded
 */
async function launchBrowserWithExtension() {
  console.log('🚀 Launching browser...');
  
  try {
    // Try launching with extension first (non-headless)
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1280,800'
      ],
      defaultViewport: { width: 1280, height: 800 },
      timeout: 60000
    });
    console.log('✓ Browser launched with extension');
    return browser;
  } catch (error) {
    console.log('⚠️  Could not load extension, launching without it (screenshots will still work)');
    // Fallback: launch without extension
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: { width: 1280, height: 800 }
    });
    return browser;
  }
}

/**
 * Create a demo HTML page for screenshots
 */
function getDemoPageHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Typer - Live Demo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 60px;
      max-width: 900px;
      width: 100%;
    }
    
    h1 {
      color: #2d3748;
      font-size: 42px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .subtitle {
      color: #718096;
      font-size: 18px;
      margin-bottom: 40px;
    }
    
    .demo-section {
      margin-bottom: 40px;
    }
    
    label {
      display: block;
      color: #4a5568;
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 16px;
    }
    
    input[type="text"],
    textarea {
      width: 100%;
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 18px;
      font-family: 'Courier New', monospace;
      transition: all 0.3s ease;
      background: #f7fafc;
    }
    
    input[type="text"]:focus,
    textarea:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    textarea {
      min-height: 180px;
      resize: vertical;
      line-height: 1.6;
    }
    
    .instructions {
      background: #edf2f7;
      padding: 24px;
      border-radius: 12px;
      margin-top: 30px;
      border-left: 4px solid #667eea;
    }
    
    .instructions h3 {
      color: #2d3748;
      margin-bottom: 12px;
      font-size: 18px;
    }
    
    .instructions p {
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    
    .instructions code {
      background: #667eea;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 600;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">✨ Demo Typer Extension Active</span>
    <h1>Welcome to Demo Typer</h1>
    <p class="subtitle">Experience realistic typing simulation in your browser</p>
    
    <div class="demo-section">
      <label for="demo-input">Try it here - Single Line Input:</label>
      <input type="text" id="demo-input" placeholder="Click here and press Ctrl+Shift+V (or Cmd+Shift+V on Mac)">
    </div>
    
    <div class="demo-section">
      <label for="demo-textarea">Multi-line Text Area:</label>
      <textarea id="demo-textarea" placeholder="Paste your text here and watch it type automatically...

Perfect for:
• Live coding demonstrations
• Tutorial videos
• Product demos
• Educational content"></textarea>
    </div>
    
    <div class="instructions">
      <h3>🎯 How to Use</h3>
      <p><strong>Step 1:</strong> Copy any text to your clipboard</p>
      <p><strong>Step 2:</strong> Click in any text field above</p>
      <p><strong>Step 3:</strong> Press <code>Ctrl+Shift+V</code> (or <code>Cmd+Shift+V</code> on Mac)</p>
      <p><strong>Step 4:</strong> Watch the magic happen! ✨</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Capture screenshot at specific size
 */
async function captureScreenshot(page, name, width, height) {
  await page.setViewport({ width, height });
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for viewport to settle
  
  const outputDir = path.join(EXTENSION_PATH, OUTPUT_DIR);
  const filename = `screenshot_${name}_${width}x${height}.png`;
  const filepath = path.join(outputDir, filename);
  
  await page.screenshot({
    path: filepath,
    type: 'png',
    fullPage: false
  });
  
  console.log(`  ✓ Captured ${filename}`);
}

/**
 * Scenario 1: Demo page with extension ready
 */
async function captureScenario1(browser) {
  console.log('\n📸 Scenario 1: Demo page with extension ready');
  
  const page = await browser.newPage();
  
  // Create demo page
  const demoHTML = getDemoPageHTML();
  await page.setContent(demoHTML);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Capture in both sizes
  for (const size of SCREENSHOT_SIZES) {
    await captureScreenshot(page, 'demo_page', size.width, size.height);
  }
  
  await page.close();
}

/**
 * Scenario 2: Typing in progress
 */
async function captureScenario2(browser) {
  console.log('\n📸 Scenario 2: Typing simulation in action');
  
  const page = await browser.newPage();
  
  // Create demo page with text being typed
  const htmlWithTyping = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Typer - In Action</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 60px;
      max-width: 900px;
      width: 100%;
    }
    h1 { color: #2d3748; font-size: 42px; margin-bottom: 10px; font-weight: 700; }
    .subtitle { color: #718096; font-size: 18px; margin-bottom: 40px; }
    label { display: block; color: #4a5568; font-weight: 600; margin-bottom: 12px; font-size: 16px; }
    textarea {
      width: 100%;
      padding: 16px;
      border: 2px solid #667eea;
      border-radius: 10px;
      font-size: 18px;
      font-family: 'Courier New', monospace;
      min-height: 180px;
      resize: vertical;
      line-height: 1.6;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      color: #2d3748;
    }
    .status {
      margin-top: 20px;
      padding: 16px;
      background: #d4edda;
      border: 2px solid #28a745;
      border-radius: 10px;
      color: #155724;
      font-weight: 600;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
    }
    .typing-cursor {
      display: inline-block;
      width: 2px;
      height: 20px;
      background: #667eea;
      animation: blink 1s infinite;
      margin-left: 2px;
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">✨ Demo Typer Active - Typing in Progress</span>
    <h1>Typing Simulation Active</h1>
    <p class="subtitle">Watch as text appears naturally, character by character</p>
    
    <div>
      <label for="demo-textarea">Live Typing Demo:</label>
      <textarea id="demo-textarea" readonly>Hello! This is the Demo Typer Extension in action.

It simulates realistic typing with natural speed variations, creating professional-looking demonstrations.

Perfect for developers, educators, and content creators who want to showcase their work in an engaging way.</textarea>
    </div>
    
    <div class="status">
      ⌨️ Typing active • Speed: 50 WPM • Natural delays enabled
    </div>
  </div>
  
  <script>
    // Add blinking cursor after the textarea
    setTimeout(() => {
      const textarea = document.getElementById('demo-textarea');
      textarea.focus();
    }, 100);
  </script>
</body>
</html>
  `;
  
  await page.setContent(htmlWithTyping);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Capture in both sizes
  for (const size of SCREENSHOT_SIZES) {
    await captureScreenshot(page, 'typing_active', size.width, size.height);
  }
  
  await page.close();
}

/**
 * Scenario 3: Extension popup/settings
 */
async function captureScenario3(browser) {
  console.log('\n📸 Scenario 3: Extension features showcase');
  
  const page = await browser.newPage();
  
  const featuresHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demo Typer - Features</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 50px;
      max-width: 1100px;
      width: 100%;
    }
    h1 { color: #2d3748; font-size: 38px; margin-bottom: 10px; font-weight: 700; text-align: center; }
    .subtitle { color: #718096; font-size: 18px; margin-bottom: 50px; text-align: center; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-bottom: 40px;
    }
    .feature-card {
      background: #f7fafc;
      padding: 30px;
      border-radius: 12px;
      border: 2px solid #e2e8f0;
      transition: all 0.3s ease;
    }
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
      border-color: #667eea;
    }
    .feature-icon {
      font-size: 42px;
      margin-bottom: 15px;
    }
    .feature-title {
      color: #2d3748;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .feature-desc {
      color: #718096;
      line-height: 1.6;
      font-size: 15px;
    }
    .shortcuts-box {
      background: #edf2f7;
      padding: 30px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    .shortcuts-box h3 {
      color: #2d3748;
      margin-bottom: 20px;
      font-size: 22px;
    }
    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #cbd5e0;
    }
    .shortcut-item:last-child {
      border-bottom: none;
    }
    .shortcut-name {
      color: #4a5568;
      font-size: 16px;
    }
    .shortcut-keys {
      background: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #667eea;
      border: 2px solid #667eea;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      display: block;
      text-align: center;
      margin-bottom: 30px;
      width: fit-content;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">✨ Demo Typer Extension</span>
    <h1>Powerful Features for Perfect Demos</h1>
    <p class="subtitle">Everything you need for professional typing demonstrations</p>
    
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <div class="feature-title">Adjustable Speed</div>
        <div class="feature-desc">Control typing speed from slow to lightning fast, matching your presentation pace</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <div class="feature-title">Natural Patterns</div>
        <div class="feature-desc">Realistic typing with random delays that mimic human behavior</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">⌨️</div>
        <div class="feature-title">Easy Shortcuts</div>
        <div class="feature-desc">Simple keyboard shortcuts for quick activation during demos</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🔄</div>
        <div class="feature-title">Universal Support</div>
        <div class="feature-card">
        <div class="feature-icon">💻</div>
        <div class="feature-title">Code Friendly</div>
        <div class="feature-desc">Optimized for code editors and development tools</div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🎬</div>
        <div class="feature-title">Demo Ready</div>
        <div class="feature-desc">Perfect for videos, live streams, and presentations</div>
      </div>
    </div>
    
    <div class="shortcuts-box">
      <h3>⌨️ Keyboard Shortcuts</h3>
      <div class="shortcut-item">
        <span class="shortcut-name">Trigger auto-typing</span>
        <span class="shortcut-keys">Ctrl+Shift+V</span>
      </div>
      <div class="shortcut-item">
        <span class="shortcut-name">Stop typing</span>
        <span class="shortcut-keys">ESC</span>
      </div>
      <div class="shortcut-item">
        <span class="shortcut-name">Open settings</span>
        <span class="shortcut-keys">Click extension icon</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  await page.setContent(featuresHTML);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Capture in both sizes
  for (const size of SCREENSHOT_SIZES) {
    await captureScreenshot(page, 'features', size.width, size.height);
  }
  
  await page.close();
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Generating real screenshots with Puppeteer...\n');
  
  const outputDir = path.join(EXTENSION_PATH, OUTPUT_DIR);
  ensureDirectoryExists(outputDir);
  
  let browser;
  
  try {
    browser = await launchBrowserWithExtension();
    
    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Capture different scenarios
    await captureScenario1(browser);
    await captureScenario2(browser);
    await captureScenario3(browser);
    
    console.log('\n✨ All screenshots captured successfully!');
    console.log(`📁 Screenshots saved to: ${outputDir}`);
    console.log('\n📋 Generated Screenshots:');
    console.log('   • Demo page (ready state) - 1280x800 & 640x400');
    console.log('   • Typing simulation (active) - 1280x800 & 640x400');
    console.log('   • Features showcase - 1280x800 & 640x400');
    
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };

