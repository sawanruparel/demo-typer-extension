# Scripts

This directory contains utility scripts for the Demo Typer Extension project.

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

