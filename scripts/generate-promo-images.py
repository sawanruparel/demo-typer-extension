#!/usr/bin/env python3

"""
Chrome Web Store Promotional Images Generator
Generates screenshots and promotional tiles for the Demo Typer Extension

Requirements:
    pip install pillow

Usage:
    python3 scripts/generate-promo-images.py
    or
    ./scripts/generate-promo-images.py
"""

import os
from PIL import Image, ImageDraw, ImageFont

# Output directory
OUTPUT_DIR = 'promo-images'

# Color scheme
COLORS = {
    'primary': '#4A90E2',      # Blue
    'secondary': '#357ABD',    # Darker blue
    'accent': '#5BA3F5',       # Lighter blue
    'text': '#FFFFFF',         # White
    'text_dark': '#2C3E50',    # Dark gray
    'background': '#F8F9FA',   # Light gray
    'success': '#27AE60',      # Green
}

# Image configurations
SCREENSHOT_SIZES = [
    (1280, 800),
    (640, 400)
]

PROMO_SIZES = {
    'small': (440, 280),
    'marquee': (1400, 560)
}

def get_font(size, bold=False):
    """
    Get a system font with fallback to default
    
    Args:
        size (int): Font size
        bold (bool): Whether to use bold font
    
    Returns:
        PIL.ImageFont: Font object
    """
    font_paths = [
        # macOS
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/SFNSDisplay.ttf',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        # Linux
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        # Windows
        'C:\\Windows\\Fonts\\arialbd.ttf' if bold else 'C:\\Windows\\Fonts\\arial.ttf',
    ]
    
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except:
                continue
    
    # Fallback to default
    return ImageFont.load_default()

def draw_text_centered(draw, text, position, font, fill, max_width=None):
    """
    Draw text centered at position
    
    Args:
        draw: ImageDraw object
        text (str): Text to draw
        position (tuple): (x, y) center position
        font: Font object
        fill: Text color
        max_width (int): Maximum width for text wrapping
    """
    if max_width:
        # Simple word wrap
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        if current_line:
            lines.append(' '.join(current_line))
        
        # Draw each line
        total_height = len(lines) * (font.size * 1.2)
        y = position[1] - total_height / 2
        
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = position[0] - text_width / 2
            draw.text((x, y), line, fill=fill, font=font)
            y += font.size * 1.2
    else:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = position[0] - text_width / 2
        y = position[1] - text_height / 2
        draw.text((x, y), text, fill=fill, font=font)

def generate_screenshot_1(size):
    """Generate screenshot showing typing simulation in action"""
    width, height = size
    img = Image.new('RGB', size, COLORS['background'])
    draw = ImageDraw.Draw(img)
    
    # Title
    title_font = get_font(int(height * 0.08), bold=True)
    draw_text_centered(draw, "Demo Typer Extension", (width // 2, int(height * 0.12)), title_font, COLORS['text_dark'])
    
    # Browser-like window
    window_padding = int(width * 0.1)
    window_y = int(height * 0.22)
    window_height = int(height * 0.65)
    
    # Window background
    draw.rectangle([window_padding, window_y, width - window_padding, window_y + window_height], 
                   fill='#FFFFFF', outline=COLORS['secondary'], width=2)
    
    # Browser address bar
    bar_height = int(height * 0.05)
    draw.rectangle([window_padding, window_y, width - window_padding, window_y + bar_height],
                   fill=COLORS['background'], outline=COLORS['secondary'], width=1)
    
    # Address bar text
    addr_font = get_font(int(height * 0.025))
    draw.text((window_padding + 10, window_y + bar_height // 4), "https://example.com", 
              fill=COLORS['text_dark'], font=addr_font)
    
    # Content area with typing effect
    content_y = window_y + bar_height + 30
    content_font = get_font(int(height * 0.04))
    
    typing_text = "Hello World!"
    cursor_x = window_padding + 30
    
    for i, char in enumerate(typing_text):
        color = COLORS['success'] if i < len(typing_text) - 3 else COLORS['text_dark']
        draw.text((cursor_x, content_y), char, fill=color, font=content_font)
        bbox = draw.textbbox((0, 0), char, font=content_font)
        cursor_x += (bbox[2] - bbox[0])
    
    # Blinking cursor
    draw.rectangle([cursor_x + 2, content_y, cursor_x + 6, content_y + int(height * 0.04)],
                   fill=COLORS['primary'])
    
    # Description
    desc_font = get_font(int(height * 0.03))
    draw_text_centered(draw, "Realistic typing simulation for impressive demos", 
                      (width // 2, int(height * 0.95)), desc_font, COLORS['text_dark'])
    
    return img

def generate_screenshot_2(size):
    """Generate screenshot showing extension popup/settings"""
    width, height = size
    img = Image.new('RGB', size, COLORS['background'])
    draw = ImageDraw.Draw(img)
    
    # Title
    title_font = get_font(int(height * 0.08), bold=True)
    draw_text_centered(draw, "Easy Configuration", (width // 2, int(height * 0.12)), title_font, COLORS['text_dark'])
    
    # Settings panel
    panel_width = int(width * 0.5)
    panel_height = int(height * 0.65)
    panel_x = (width - panel_width) // 2
    panel_y = int(height * 0.22)
    
    # Panel background
    draw.rounded_rectangle([panel_x, panel_y, panel_x + panel_width, panel_y + panel_height],
                          radius=10, fill='#FFFFFF', outline=COLORS['primary'], width=3)
    
    # Panel header
    header_font = get_font(int(height * 0.05), bold=True)
    draw.text((panel_x + 20, panel_y + 20), "⚙️ Settings", fill=COLORS['primary'], font=header_font)
    
    # Settings options
    option_font = get_font(int(height * 0.035))
    option_y = panel_y + 100
    option_spacing = int(height * 0.08)
    
    options = [
        "⌨️  Typing Speed: Adjustable",
        "⏱️  Delay: Customizable",
        "🎯  Target: Any Text Field",
        "🔄  Keyboard Shortcuts",
    ]
    
    for option in options:
        draw.text((panel_x + 40, option_y), option, fill=COLORS['text_dark'], font=option_font)
        option_y += option_spacing
    
    # Description
    desc_font = get_font(int(height * 0.03))
    draw_text_centered(draw, "Customize typing speed and behavior to match your demo style", 
                      (width // 2, int(height * 0.95)), desc_font, COLORS['text_dark'])
    
    return img

def generate_screenshot_3(size):
    """Generate screenshot showing use case"""
    width, height = size
    img = Image.new('RGB', size, COLORS['background'])
    draw = ImageDraw.Draw(img)
    
    # Title
    title_font = get_font(int(height * 0.08), bold=True)
    draw_text_centered(draw, "Perfect for Presentations", (width // 2, int(height * 0.12)), title_font, COLORS['text_dark'])
    
    # Three feature boxes
    box_width = int(width * 0.25)
    box_height = int(height * 0.5)
    box_y = int(height * 0.25)
    spacing = int(width * 0.04)
    start_x = (width - (3 * box_width + 2 * spacing)) // 2
    
    features = [
        ("💻", "Code Demos", "Perfect for live\ncoding sessions"),
        ("🎓", "Tutorials", "Create engaging\nvideo tutorials"),
        ("🎪", "Presentations", "Impress your\naudience"),
    ]
    
    icon_font = get_font(int(height * 0.12))
    title_feat_font = get_font(int(height * 0.045), bold=True)
    desc_feat_font = get_font(int(height * 0.03))
    
    for i, (icon, title, desc) in enumerate(features):
        box_x = start_x + i * (box_width + spacing)
        
        # Box
        draw.rounded_rectangle([box_x, box_y, box_x + box_width, box_y + box_height],
                              radius=10, fill='#FFFFFF', outline=COLORS['primary'], width=2)
        
        # Icon
        draw_text_centered(draw, icon, (box_x + box_width // 2, box_y + int(box_height * 0.25)),
                          icon_font, COLORS['primary'])
        
        # Title
        draw_text_centered(draw, title, (box_x + box_width // 2, box_y + int(box_height * 0.55)),
                          title_feat_font, COLORS['text_dark'])
        
        # Description
        desc_lines = desc.split('\n')
        desc_y = box_y + int(box_height * 0.7)
        for line in desc_lines:
            draw_text_centered(draw, line, (box_x + box_width // 2, desc_y),
                              desc_feat_font, COLORS['text_dark'])
            desc_y += int(height * 0.04)
    
    # Description
    desc_font = get_font(int(height * 0.03))
    draw_text_centered(draw, "Make your demonstrations look professional and polished", 
                      (width // 2, int(height * 0.92)), desc_font, COLORS['text_dark'])
    
    return img

def generate_small_promo_tile():
    """Generate small promotional tile (440x280)"""
    width, height = PROMO_SIZES['small']
    img = Image.new('RGB', (width, height), COLORS['primary'])
    draw = ImageDraw.Draw(img)
    
    # Large "T" icon
    icon_font = get_font(int(height * 0.4), bold=True)
    draw_text_centered(draw, "T", (width // 2, int(height * 0.35)), icon_font, COLORS['text'])
    
    # Title
    title_font = get_font(int(height * 0.12), bold=True)
    draw_text_centered(draw, "Demo Typer", (width // 2, int(height * 0.68)), title_font, COLORS['text'])
    
    # Subtitle
    subtitle_font = get_font(int(height * 0.07))
    draw_text_centered(draw, "Realistic Typing Simulation", (width // 2, int(height * 0.85)), 
                      subtitle_font, COLORS['text'])
    
    return img

def generate_marquee_promo_tile():
    """Generate marquee promotional tile (1400x560)"""
    width, height = PROMO_SIZES['marquee']
    img = Image.new('RGB', (width, height), COLORS['primary'])
    draw = ImageDraw.Draw(img)
    
    # Split into left and right sections
    left_width = int(width * 0.4)
    
    # Left section - Icon and branding
    icon_font = get_font(int(height * 0.4), bold=True)
    draw_text_centered(draw, "T", (left_width // 2, height // 2), icon_font, COLORS['text'])
    
    # Right section - Text content
    right_x = left_width + int(width * 0.05)
    
    # Title
    title_font = get_font(int(height * 0.12), bold=True)
    draw.text((right_x, int(height * 0.2)), "Demo Typer Extension", fill=COLORS['text'], font=title_font)
    
    # Subtitle
    subtitle_font = get_font(int(height * 0.06))
    draw.text((right_x, int(height * 0.4)), "Create impressive demos with realistic typing simulation", 
              fill=COLORS['text'], font=subtitle_font)
    
    # Features
    feature_font = get_font(int(height * 0.045))
    feature_y = int(height * 0.58)
    features = [
        "✓ Adjustable typing speed",
        "✓ Natural typing patterns",
        "✓ Easy keyboard shortcuts",
    ]
    
    for feature in features:
        draw.text((right_x + 20, feature_y), feature, fill=COLORS['text'], font=feature_font)
        feature_y += int(height * 0.1)
    
    return img

def convert_to_24bit_png(img):
    """
    Convert image to 24-bit PNG (RGB without alpha)
    
    Args:
        img: PIL Image
    
    Returns:
        PIL.Image: Image in RGB mode
    """
    if img.mode != 'RGB':
        return img.convert('RGB')
    return img

def main():
    """Main function to generate all promotional images"""
    # Get the output directory path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(os.path.dirname(script_dir), OUTPUT_DIR)
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    print('🎨 Generating Chrome Web Store promotional images...\n')
    
    # Generate screenshots
    print('📸 Generating screenshots:')
    
    screenshot_generators = [
        generate_screenshot_1,
        generate_screenshot_2,
        generate_screenshot_3,
    ]
    
    for i, generator in enumerate(screenshot_generators, 1):
        # Generate both sizes
        for j, size in enumerate(SCREENSHOT_SIZES, 1):
            try:
                img = generator(size)
                img = convert_to_24bit_png(img)
                filename = f'screenshot_{i}_{size[0]}x{size[1]}.png'
                filepath = os.path.join(output_dir, filename)
                img.save(filepath, 'PNG')
                print(f'  ✓ {filename}')
            except Exception as e:
                print(f'  ✗ Failed to generate {filename}: {str(e)}')
    
    # Generate promotional tiles
    print('\n🎯 Generating promotional tiles:')
    
    try:
        # Small promo tile
        small_tile = generate_small_promo_tile()
        small_tile = convert_to_24bit_png(small_tile)
        small_path = os.path.join(output_dir, 'small_promo_tile_440x280.png')
        small_tile.save(small_path, 'PNG')
        print(f'  ✓ small_promo_tile_440x280.png')
    except Exception as e:
        print(f'  ✗ Failed to generate small promo tile: {str(e)}')
    
    try:
        # Marquee promo tile
        marquee_tile = generate_marquee_promo_tile()
        marquee_tile = convert_to_24bit_png(marquee_tile)
        marquee_path = os.path.join(output_dir, 'marquee_promo_tile_1400x560.png')
        marquee_tile.save(marquee_path, 'PNG')
        print(f'  ✓ marquee_promo_tile_1400x560.png')
    except Exception as e:
        print(f'  ✗ Failed to generate marquee promo tile: {str(e)}')
    
    print(f'\n✨ All promotional images generated successfully!')
    print(f'📁 Images saved to: {output_dir}')
    print(f'\n📋 Chrome Web Store Requirements:')
    print(f'   • Screenshots: 1280x800 or 640x400 (up to 5 max)')
    print(f'   • Small promo tile: 440x280')
    print(f'   • Marquee promo tile: 1400x560')
    print(f'   • All images are 24-bit PNG (no alpha)')

if __name__ == '__main__':
    main()

