# Scripts

This directory contains utility scripts for the Demo Typer Extension project.

## Scripts Overview

- **`generate-icons.py`** - Generates extension icons for the browser
- **`generate-promo-images.py`** - Generates Chrome Web Store promotional images

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

The script generates three PNG icon files in the `icons/` directory:

- `icon16.png` - 16x16 pixels
- `icon32.png` - 32x32 pixels  
- `icon128.png` - 128x128 pixels

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
SIZES = [16, 32, 128]  # Add or remove sizes as needed
```

---

## Promotional Images Generator (`generate-promo-images.py`)

A Python script that generates all required promotional images for the Chrome Web Store.

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

The script generates promotional images in the `promo-images/` directory:

#### Screenshots (3 variations, 2 sizes each)
- `screenshot_1_1280x800.png` - Typing simulation demo (large)
- `screenshot_1_640x400.png` - Typing simulation demo (small)
- `screenshot_2_1280x800.png` - Configuration/settings (large)
- `screenshot_2_640x400.png` - Configuration/settings (small)
- `screenshot_3_1280x800.png` - Use cases (large)
- `screenshot_3_640x400.png` - Use cases (small)

#### Promotional Tiles
- `small_promo_tile_440x280.png` - Small promotional tile (440×280)
- `marquee_promo_tile_1400x560.png` - Marquee promotional tile (1400×560)

### Chrome Web Store Requirements

All generated images meet the Chrome Web Store specifications:

- **Screenshots**: 1280×800 or 640×400 pixels (up to 5 maximum)
- **Small Promo Tile**: 440×280 pixels
- **Marquee Promo Tile**: 1400×560 pixels
- **Format**: 24-bit PNG (no alpha channel) or JPEG

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

You can also modify the screenshot generators to create different visual presentations.

