# Scripts

This directory contains utility scripts for the Demo Typer Extension project.

## Scripts Overview

- **`generate-icons.py`** - Generates extension icons for the browser
- **`generate-screenshots.js`** - Generates professional screenshots using Playwright (recommended for Chrome Web Store)
- **`generate-promo-images.js`** - Generates promotional tiles using HTML/CSS and Playwright (small promo tile and marquee)
- **`publish-webstore-api.js`** - Uses the official Chrome Web Store API to build, upload, and submit a release
- **`complete-webstore-dashboard.js`** - Opens a persistent logged-in browser session for dashboard-only tasks like listing assets
- **`verify-webstore-public.js`** - Checks the public Chrome Web Store listing and optionally verifies the live version via the API
- **`webstore-release-lib.js`** - Shared helpers for the release scripts
- **`publish-webstore.js`** - Builds, uploads, publishes, and validates the Chrome Web Store listing for the existing extension item

---

## Icon Generator (`generate-icons.py`)

A Python script that generates extension icons with the letter "T" in multiple sizes.

### Requirements

- Python 3.x
- Pillow (PIL) library

### Installation

Install the required Pillow library:

```bash
pip3 install pillow --user
```

### Usage

You can run the script in several ways:

**Using npm:**
```bash
npm run generate-icons
```

**Direct Python execution:**
```bash
python3 scripts/generate-icons.py
```

**As an executable (if chmod +x was applied):**
```bash
./scripts/generate-icons.py
```

### Output

The script generates four PNG icon files in the `icons/` directory:

- `icon16.png` - 16×16 pixels
- `icon32.png` - 32×32 pixels
- `icon48.png` - 48×48 pixels
- `icon128.png` - 128×128 pixels

Each icon features a white letter "T" on a blue background (#4A90E2).

### Customization

You can customize the icon appearance by editing the `CONFIG` dictionary in the script:

```python
CONFIG = {
    'background_color': '#4A90E2',  # Blue background
    'text_color': '#FFFFFF',        # White text
    'font_weight': 'bold'
}
```

You can also change the sizes by modifying the `SIZES` list:

```python
SIZES = [16, 32, 48, 128]  # Add or remove sizes as needed
```

---

## Screenshots Generator (`generate-screenshots.js`)

**⭐ RECOMMENDED for Chrome Web Store submissions**

A comprehensive Node.js script using Playwright that generates professional screenshots of the extension in action.

### Why Use This?

- **Authentic**: Shows your actual extension UI and functionality
- **Professional**: Includes real screenshots and contextual usage scenarios
- **Accurate**: Displays exactly what users will see
- **Comprehensive**: Covers multiple use cases (demo pages, editors, code environments)

### Requirements

- Node.js 14+
- Playwright

### Installation

Install dependencies:

```bash
npm install
```

### Usage

**Using npm (recommended):**
```bash
npm run generate-screenshots
```

**Direct Node execution:**
```bash
node scripts/generate-screenshots.js
```

### What It Does

1. Launches a real Chrome browser instance with the extension loaded
2. Navigates to actual extension pages (demo-page.html, popup.html, options.html)
3. Creates contextual usage scenarios showing the extension in realistic environments
4. Captures professional screenshots of all scenarios
5. Saves screenshots at Chrome Web Store required dimensions
6. Generates both large (1280×800) and small (640×400) versions

### Output

The script generates **comprehensive screenshots** in the `promo-images/` directory:

**Actual Extension Pages:**
- `screenshot_demo_page_1280x800.png` / `_640x400.png` - Real demo-page.html
- `screenshot_popup_in_context_1280x800.png` / `_640x400.png` - Popup shown in realistic browser context
- `screenshot_options_1280x800.png` / `_640x400.png` - Real options page

**Usage Scenarios:**
- `screenshot_typing_active_1280x800.png` / `_640x400.png` - Typing simulation in action
- `screenshot_editor_context_1280x800.png` / `_640x400.png` - Extension in document editor
- `screenshot_code_editor_1280x800.png` / `_640x400.png` - Extension in code editor
- `screenshot_features_1280x800.png` / `_640x400.png` - Features showcase (marketing)

### Customization

The script includes 7 comprehensive scenarios:

- **Scenario 1**: Loads `demo-page.html` from your extension
- **Scenario 2**: Loads `popup.html` from your extension  
- **Scenario 3**: Creates a typing simulation in action page
- **Scenario 4**: Loads `options.html` from your extension
- **Scenario 5**: Shows extension in a document editor context
- **Scenario 6**: Shows extension in a code editor context
- **Scenario 7**: Creates a features showcase (marketing)

To customize the generated scenarios (3, 5, 6, 7), edit the HTML content in their respective functions.

### Troubleshooting

**Issue: "Browser failed to launch"**
- Solution: Run `npx playwright install chromium`

**Issue: "Extension not loading"**
- Solution: Make sure the extension files are in the project root and manifest.json is valid

**Issue: "Screenshots are blank"**
- Solution: Increase the `waitForTimeout` values to give pages more time to render

---

## Promotional Tiles Generator (`generate-promo-images.js`)

**📌 Note:** This script generates promotional tiles only (not screenshots). For screenshots, use `generate-screenshots.js` instead.

A Node.js script using Playwright that generates promotional tiles for the Chrome Web Store using HTML/CSS for superior design quality.

### Requirements

- Node.js 14+
- Playwright

### Installation

Install dependencies:

```bash
npm install
```

### Usage

**Using npm (recommended):**
```bash
npm run generate-promo
```

**Direct Node execution:**
```bash
node scripts/generate-promo-images.js
```

### Output

The script generates promotional tiles in the `promo-images/` directory:
- `small_promo_tile_440x280.png` - Small promotional tile (440×280)
- `marquee_promo_tile_1400x560.png` - Marquee promotional tile (1400×560)

### Chrome Web Store Requirements

All generated tiles meet the Chrome Web Store specifications:

- **Small Promo Tile**: 440×280 pixels
- **Marquee Promo Tile**: 1400×560 pixels
- **Format**: 24-bit PNG (no alpha channel) or JPEG

**Note**: For screenshots (1280×800 or 640×400), use `generate-screenshots.js` for real extension screenshots.

### Customization

You can customize the appearance by editing the HTML/CSS in the script functions:

- **Small Promo Tile**: Edit `getSmallPromoTileHTML()` function
- **Marquee Tile**: Edit `getMarqueePromoTileHTML()` function

The HTML/CSS approach gives you full control over:
- Gradients and modern CSS effects
- Typography and font styling
- Layout with Flexbox/Grid
- Animations and transitions
- Shadows and backdrop filters

---

## Complete Workflow for Chrome Web Store Submission

To generate all required assets:

1. **Generate extension icons:**
   ```bash
   npm run generate-icons
   ```

2. **Generate real screenshots:**
   ```bash
   npm run generate-screenshots
   ```

3. **Generate promotional tiles:**
   ```bash
   npm run generate-promo
   ```

All assets will be in the appropriate directories:
- Icons: `icons/` directory
- Screenshots & Promo Tiles: `promo-images/` directory

---

## Chrome Web Store Release Scripts

The repo now splits Web Store automation into three scripts:

1. `publish-webstore-api.js` for the official API path
2. `complete-webstore-dashboard.js` for dashboard-only browser work
3. `verify-webstore-public.js` for the live public page

### Usage

```bash
npm run publish:webstore:api
npm run publish:webstore:dashboard
npm run publish:webstore:verify
```

### Required environment

```bash
export CHROME_WEBSTORE_PUBLISHER_ID="your-publisher-id"
```

Provide auth with one of these patterns:

```bash
export CHROME_WEBSTORE_ACCESS_TOKEN="..."
export CHROME_WEBSTORE_SERVICE_ACCOUNT_JSON_PATH="/absolute/path/to/service-account.json"
export CHROME_WEBSTORE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
export CHROME_WEBSTORE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
export CHROME_WEBSTORE_CLIENT_ID="..."
export CHROME_WEBSTORE_CLIENT_SECRET="..."
export CHROME_WEBSTORE_REFRESH_TOKEN="..."
```

### Handy examples

```bash
# Official API release
npm run publish:webstore:api -- --wait-published

# Dashboard helper after login
npm run publish:webstore:dashboard -- --tab store-listing

# Revalidate the live listing later
npm run publish:webstore:verify -- --wait-live
```
