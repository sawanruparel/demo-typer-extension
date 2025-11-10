# Scripts

This directory contains utility scripts for the Demo Typer Extension project.

## Scripts Overview

- **`generate-icons.py`** - Generates extension icons for the browser
- **`generate-screenshots.js`** - Captures real screenshots using Puppeteer (recommended for Chrome Web Store)
- **`generate-promo-images.py`** - Generates promotional tiles (small promo tile and marquee)

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

## Real Screenshots Generator (`generate-screenshots.js`)

**⭐ RECOMMENDED for Chrome Web Store submissions**

A Node.js script using Puppeteer that captures real screenshots of the extension in action.

### Why Use This?

- **Authentic**: Shows your actual extension UI and functionality
- **Professional**: Real screenshots look better than mockups
- **Accurate**: Displays exactly what users will see
- **Required**: Chrome Web Store prefers real screenshots over generated graphics

### Requirements

- Node.js 14+
- Puppeteer (automatically installs Chromium)

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

1. Launches a real Chrome browser instance
2. Loads your extension automatically
3. Creates demo pages showcasing the extension
4. Captures screenshots at required dimensions
5. Saves screenshots in both 1280×800 and 640×400 sizes

### Output

The script generates screenshots in the `promo-images/` directory:

- `screenshot_demo_page_1280x800.png` - Extension ready state (large)
- `screenshot_demo_page_640x400.png` - Extension ready state (small)
- `screenshot_typing_active_1280x800.png` - Typing in progress (large)
- `screenshot_typing_active_640x400.png` - Typing in progress (small)
- `screenshot_features_1280x800.png` - Features showcase (large)
- `screenshot_features_640x400.png` - Features showcase (small)

### Customization

You can customize the screenshots by editing the HTML content in the script:

- **`getDemoPageHTML()`** - Main demo page layout
- **`captureScenario2()`** - Typing active state
- **`captureScenario3()`** - Features showcase

To add more scenarios, create new capture functions following the same pattern.

### Troubleshooting

**Issue: "Browser failed to launch"**
- Solution: Puppeteer will download Chromium automatically on first install

**Issue: "Extension not loading"**
- Solution: Make sure the extension files are in the project root and manifest.json is valid

**Issue: "Screenshots are blank"**
- Solution: Increase the `waitForTimeout` values to give pages more time to render

---

## Promotional Tiles Generator (`generate-promo-images.py`)

**📌 Note:** This script generates promotional tiles only (not screenshots). For screenshots, use `generate-screenshots.js` instead.

A Python script that generates promotional tiles for the Chrome Web Store.

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
npm run generate-promo
```

**Direct Python execution:**
```bash
python3 scripts/generate-promo-images.py
```

**As an executable (if chmod +x was applied):**
```bash
./scripts/generate-promo-images.py
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

You can customize the appearance by editing the `COLORS` dictionary in the script:

```python
COLORS = {
    'primary': '#4A90E2',      # Blue
    'secondary': '#357ABD',    # Darker blue
    'accent': '#5BA3F5',       # Lighter blue
    'text': '#FFFFFF',         # White
    'text_dark': '#2C3E50',    # Dark gray
    'background': '#F8F9FA',   # Light gray
    'success': '#27AE60',      # Green
}
```

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

