#!/usr/bin/env node

/**
 * Promotional Images Generator using Puppeteer
 * Generates Chrome Web Store promo tiles (PNG) with modern styling
 * and a realistic "typing preview" editor mock.
 *
 * Requirements:
 *   npm i puppeteer
 *
 * Usage examples:
 *   node scripts/generate-promo-images.js
 *   node scripts/generate-promo-images.js --name="Demo Typer" --tagline="Human-like typing for demos" --theme=indigo
 *   OUTPUT_DIR=promo-images node scripts/generate-promo-images.js --emoji="⌨️"
 *
 * Options (CLI flags or env vars):
 *   --name / EXT_NAME           Extension name (default: "Demo Typer")
 *   --tagline / EXT_TAGLINE     Subtitle/tagline (default: "Realistic Typing Simulation")
 *   --badge / EXT_BADGE         Small badge label (default: "Chrome Extension")
 *   --emoji / EXT_EMOJI         Leading emoji (default: "⌨️")
 *   --theme / EXT_THEME         Color theme: indigo | teal | amber | purple (default: "indigo")
 *   --out   / OUTPUT_DIR        Output directory (default: "promo-images")
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ---------- Config ----------

const argv = parseArgs(process.argv.slice(2));

const EXT_NAME    = argv.name    || process.env.EXT_NAME     || 'Demo Typer';
const EXT_TAGLINE = argv.tagline || process.env.EXT_TAGLINE  || 'Realistic Typing Simulation';
const EXT_BADGE   = argv.badge   || process.env.EXT_BADGE    || 'Chrome Extension';
const EXT_EMOJI   = argv.emoji   || process.env.EXT_EMOJI    || '⌨️';
const THEME_KEY   = (argv.theme  || process.env.EXT_THEME    || 'indigo').toLowerCase();
const OUTPUT_DIR  = argv.out     || process.env.OUTPUT_DIR   || 'promo-images';

const EXTENSION_PATH = path.join(__dirname, '..');

// Promo tile sizes required by Chrome Web Store
const PROMO_SIZES = {
  small:   { width: 440,  height: 280,  name: 'small_promo_tile_440x280.png' },
  marquee: { width: 1400, height: 560,  name: 'marquee_promo_tile_1400x560.png' }
};

// Minimal palettes with subtle gradients
const THEMES = {
  indigo: {
    grad: ['#667eea', '#764ba2'],
    glass: 'rgba(255,255,255,0.25)',
    glassBorder: 'rgba(255,255,255,0.35)',
    editorBg: '#0b1020',
    accent: '#a5b4fc'
  },
  teal: {
    grad: ['#06b6d4', '#3b82f6'],
    glass: 'rgba(255,255,255,0.23)',
    glassBorder: 'rgba(255,255,255,0.32)',
    editorBg: '#081a1a',
    accent: '#99f6e4'
  },
  amber: {
    grad: ['#f59e0b', '#ef4444'],
    glass: 'rgba(255,255,255,0.22)',
    glassBorder: 'rgba(255,255,255,0.30)',
    editorBg: '#1b1306',
    accent: '#fde68a'
  },
  purple: {
    grad: ['#8b5cf6', '#ec4899'],
    glass: 'rgba(255,255,255,0.25)',
    glassBorder: 'rgba(255,255,255,0.35)',
    editorBg: '#1a0e1e',
    accent: '#f5d0fe'
  }
};

const THEME = THEMES[THEME_KEY] || THEMES.indigo;

// ---------- Utils ----------

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, vRaw] = a.slice(2).split('=');
      if (vRaw !== undefined) {
        out[k] = vRaw;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        out[k] = args[++i];
      } else {
        out[k] = true;
      }
    }
  }
  return out;
}

// Ensure output directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------- HTML Builders ----------

/**
 * Small Promo (440x280)
 * - Centered layout with tags
 * - Subtle glassy chips
 */
function getSmallPromoTileHTML() {
  const grad = `linear-gradient(135deg, ${THEME.grad[0]} 0%, ${THEME.grad[1]} 100%)`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${safe(EXT_NAME)} - Small Promo</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:440px; height:280px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: ${grad};
    display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;
  }
  .bg-circle {
    position:absolute; border-radius:50%; background: rgba(255,255,255,0.08); filter: blur(0.2px);
  }
  .c1{ width:160px; height:160px; top:-40px; right:-30px; }
  .c2{ width:120px; height:120px; bottom:-30px; left:-20px; }
  .c3{ width:100px; height:100px; top:50%; right:10px; opacity:0.06; transform:translateY(-50%); }
  .container { text-align:center; z-index:1; padding:26px; }
  .icon { font-size:64px; margin-bottom:10px; text-shadow:0 4px 12px rgba(0,0,0,0.25); }
  h1 {
    color:#fff; font-size:34px; line-height:1.05; font-weight:800; letter-spacing:0.2px;
    text-shadow:0 2px 8px rgba(0,0,0,0.25); margin-bottom:6px;
  }
  .subtitle { color:rgba(255,255,255,0.96); font-size:15px; font-weight:600; margin-bottom:14px; }
  .tags { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
  .tag {
    background:${THEME.glass}; color:#fff; padding:6px 12px; border-radius:14px; font-size:12px; font-weight:700;
    border:1px solid ${THEME.glassBorder}; backdrop-filter: blur(10px);
    box-shadow:0 2px 8px rgba(0,0,0,0.18);
  }
</style>
</head>
<body>
  <div class="bg-circle c1"></div>
  <div class="bg-circle c2"></div>
  <div class="bg-circle c3"></div>

  <div class="container">
    <div class="icon">${safe(EXT_EMOJI)}</div>
    <h1>${safe(EXT_NAME)}</h1>
    <p class="subtitle">${safe(EXT_TAGLINE)}</p>
    <div class="tags">
      <span class="tag">⚡ Adjustable speed</span>
      <span class="tag">🎯 Human-like</span>
      <span class="tag">⌨️ Shortcut-ready</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Marquee Promo (1400x560)
 * - Left: circular emblem
 * - Right: headline, badge, features
 * - NEW: Editor mock with blinking caret + "typed" sample
 */
function getMarqueePromoTileHTML() {
  const grad = `linear-gradient(120deg, ${THEME.grad[0]} 0%, ${THEME.grad[1]} 100%)`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${safe(EXT_NAME)} - Marquee Promo</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1400px; height:560px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: ${grad};
    display:flex; align-items:center; position:relative; overflow:hidden;
  }
  .bg-shape { position:absolute; border-radius:50%; background:rgba(255,255,255,0.08); }
  .s1{ width:300px; height:300px; top:-100px; right:200px; }
  .s2{ width:240px; height:240px; bottom:-80px; left:150px; }
  .s3{ width:180px; height:180px; top:60px; right:50px; opacity:0.5; }
  .s4{ width:150px; height:150px; bottom:80px; right:300px; opacity:0.4; }
  .content { display:flex; align-items:center; width:100%; padding:0 80px; gap:60px; z-index:1; }
  .left { flex:0 0 420px; display:flex; flex-direction:column; align-items:center; gap:24px; }
  .icon-wrap { position:relative; display:inline-block; }
  .icon-bg {
    width:200px; height:200px; background:#fff; border-radius:50%;
    display:flex; align-items:center; justify-content:center; box-shadow:0 24px 70px rgba(0,0,0,0.35);
    position:relative;
  }
  .ring { position:absolute; border-radius:50%; border:2px solid rgba(255,255,255,0.35); animation:pulse 2.4s ease-in-out infinite; }
  .ring.r1{ width:236px; height:236px; }
  .ring.r2{ width:268px; height:268px; animation-delay:.35s; }
  @keyframes pulse { 0%,100%{ transform:scale(1); opacity:.55 } 50%{ transform:scale(1.05); opacity:.32 } }
  .bigicon { font-size:96px; }

  .right { flex:1; color:#fff; }
  .badge {
    display:inline-block; background:${THEME.glass}; color:#fff; padding:9px 22px; border-radius:22px;
    font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.55px; margin-bottom:16px;
    border:1px solid ${THEME.glassBorder}; backdrop-filter: blur(10px); box-shadow:0 4px 12px rgba(0,0,0,.15);
  }
  h1 { font-size:76px; font-weight:900; margin-bottom:12px; text-shadow:0 4px 16px rgba(0,0,0,0.35); line-height:1.04; }
  .subtitle { font-size:26px; font-weight:500; margin-bottom:28px; opacity:.98; text-shadow:0 2px 8px rgba(0,0,0,.2); }

  /* Feature grid */
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:26px; }
  .card {
    background: rgba(255,255,255,0.16); backdrop-filter: blur(10px);
    padding:18px; border-radius:14px; border:1px solid rgba(255,255,255,0.22);
    box-shadow:0 6px 18px rgba(0,0,0,0.12);
  }
  .fi { font-size:32px; display:block; margin-bottom:8px; }
  .ft { font-size:16px; font-weight:800; margin-bottom:4px; }
  .fd { font-size:12px; opacity:.92; line-height:1.4; }

  /* Editor mock with blinking caret + typed text */
  .editor {
    width:100%; max-width:760px; height:180px; border-radius:16px; overflow:hidden;
    box-shadow:0 18px 45px rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.18);
    background: linear-gradient(180deg, ${THEME.editorBg} 0%, rgba(0,0,0,.75) 100%);
  }
  .ed-header {
    height:36px; background: rgba(255,255,255,0.06); border-bottom:1px solid rgba(255,255,255,0.12);
    display:flex; align-items:center; gap:8px; padding:0 12px; color:#cbd5e1; font-size:12px;
  }
  .dot { width:10px; height:10px; border-radius:50%; opacity:.9; }
  .dot.r{ background:#ef4444; } .dot.y{ background:#f59e0b; } .dot.g{ background:#10b981; }
  .ed-body {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace;
    color:#e5e7eb; font-size:14px; line-height:1.6; padding:14px 16px;
    white-space:pre; position:relative;
  }
  .caret {
    display:inline-block; width:8px; height:1.2em; background:${THEME.accent}; margin-left:2px;
    animation:blink 1.1s step-end infinite; vertical-align:bottom;
  }
  @keyframes blink { 50% { opacity:0; } }
  .kw { color:#93c5fd; } .str{ color:#fca5a5; } .cm{ color:#9ca3af; font-style:italic; }
  .ac { color:${THEME.accent}; }
</style>
</head>
<body>
  <div class="bg-shape s1"></div>
  <div class="bg-shape s2"></div>
  <div class="bg-shape s3"></div>
  <div class="bg-shape s4"></div>

  <div class="content">
    <div class="left">
      <div class="icon-wrap">
        <div class="icon-bg">
          <div class="bigicon">${safe(EXT_EMOJI)}</div>
          <div class="ring r1"></div>
          <div class="ring r2"></div>
        </div>
      </div>
    </div>

    <div class="right">
      <div class="badge">🚀 ${safe(EXT_BADGE)}</div>
      <h1>${safe(EXT_NAME)}</h1>
      <p class="subtitle">${safe(EXT_TAGLINE)}</p>

      <div class="grid">
        <div class="card"><span class="fi">⚡</span><div class="ft">Adjustable Speed</div><div class="fd">Control typing pace in real time.</div></div>
        <div class="card"><span class="fi">🎯</span><div class="ft">Natural Patterns</div><div class="fd">Human-like pauses and bursts.</div></div>
        <div class="card"><span class="fi">⌨️</span><div class="ft">Easy Shortcuts</div><div class="fd">One-tap start and stop.</div></div>
      </div>

      <div class="editor">
        <div class="ed-header">
          <div class="dot r"></div><div class="dot y"></div><div class="dot g"></div>
          <span style="margin-left:8px; opacity:.9;">demo-typing.js</span>
        </div>
        <div class="ed-body">
<span class="cm">// Simulate realistic typing</span>
<span class="kw">const</span> typer <span class="kw">=</span> <span class="kw">new</span> <span class="ac">DemoTyper</span>(<span class="str">'Hello, world!'</span>, { speed: <span class="ac">120</span> });${' '}
<span class="kw">await</span> typer.<span class="ac">start</span>()<span class="kw">;</span> <span class="caret"></span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Basic HTML escaping for dynamic text
function safe(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ---------- Screenshot Helper ----------

async function capturePromoTile(browser, html, width, height, filename) {
  const page = await browser.newPage();
 
   // Set viewport to exact required dimensions
   await page.setViewport({ width, height, deviceScaleFactor: 1 });

  // Reduce animation variability
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' }
  ]);

   await page.setContent(html, { waitUntil: 'networkidle0' });
 
   // Let fonts & animations settle briefly
   await new Promise(resolve => setTimeout(resolve, 600));

  const outputDir = path.join(EXTENSION_PATH, OUTPUT_DIR);
  const filepath = path.join(outputDir, filename);

  await page.screenshot({
    path: filepath,
    type: 'png',
    fullPage: false
  });

  console.log(`  ✓ Generated ${filename}`);
  await page.close();
}

// ---------- Main ----------

async function main() {
  console.log('🎨 Generating Chrome Web Store promotional images...\n');

  const outputDir = path.join(EXTENSION_PATH, OUTPUT_DIR);
  ensureDirectoryExists(outputDir);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('📸 Generating promotional tiles:');

    await capturePromoTile(
      browser,
      getSmallPromoTileHTML(),
      PROMO_SIZES.small.width,
      PROMO_SIZES.small.height,
      PROMO_SIZES.small.name
    );

    await capturePromoTile(
      browser,
      getMarqueePromoTileHTML(),
      PROMO_SIZES.marquee.width,
      PROMO_SIZES.marquee.height,
      PROMO_SIZES.marquee.name
    );

    console.log('\n✨ All promotional images generated successfully!');
    console.log(`📁 Images saved to: ${outputDir}`);
    console.log('\n📋 Chrome Web Store Requirements checked:');
    console.log('   • Small promo tile: 440×280 ✓');
    console.log('   • Marquee promo tile: 1400×560 ✓');
    console.log('   • Format: PNG ✓');

  } catch (error) {
    console.error('❌ Error generating promotional images:', error);
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
