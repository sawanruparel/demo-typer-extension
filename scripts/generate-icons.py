#!/usr/bin/env python3

"""
Icon Generator Script
Generates icon images with the letter "T" in multiple sizes
Sizes: 16x16, 32x32, 128x128

Requirements:
    pip install pillow

Usage:
    python3 scripts/generate-icons.py
    or
    ./scripts/generate-icons.py
"""

import os
from PIL import Image, ImageDraw, ImageFont

# Icon sizes to generate
SIZES = [16, 32, 128]

# Icon configuration
CONFIG = {
    'background_color': '#4A90E2',  # Blue background
    'text_color': '#FFFFFF',        # White text
    'font_weight': 'bold'
}

def generate_icon(size):
    """
    Generate an icon of specified size with the letter "T"
    
    Args:
        size (int): The width and height of the icon in pixels
    
    Returns:
        PIL.Image: The generated icon image
    """
    # Create a new image with the specified background color
    img = Image.new('RGB', (size, size), CONFIG['background_color'])
    draw = ImageDraw.Draw(img)
    
    # Calculate font size (approximately 60% of icon size)
    font_size = int(size * 0.6)
    
    # Try to use a system font, fall back to default if not available
    try:
        # Try to load a bold font
        # Common paths for different operating systems
        font_paths = [
            '/System/Library/Fonts/Helvetica.ttc',  # macOS
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  # Linux
            'C:\\Windows\\Fonts\\arialbd.ttf',  # Windows
            '/System/Library/Fonts/SFNSDisplay.ttf',  # macOS San Francisco
        ]
        
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except:
                    continue
        
        if font is None:
            # Fall back to default font
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()
    
    # Get text bounding box for centering
    text = "T"
    
    # For better positioning, use textbbox
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except:
        # Fallback for older Pillow versions
        text_width, text_height = draw.textsize(text, font=font)
    
    # Calculate position to center the text
    x = (size - text_width) / 2
    y = (size - text_height) / 2
    
    # Draw the letter "T"
    draw.text((x, y), text, fill=CONFIG['text_color'], font=font)
    
    return img

def main():
    """Main function to generate all icons"""
    # Get the icons directory path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(os.path.dirname(script_dir), 'icons')
    
    # Ensure icons directory exists
    os.makedirs(icons_dir, exist_ok=True)
    
    print('🎨 Generating icons...\n')
    
    # Generate icons for each size
    for size in SIZES:
        try:
            icon = generate_icon(size)
            filename = f'icon{size}.png'
            filepath = os.path.join(icons_dir, filename)
            
            icon.save(filepath, 'PNG')
            print(f'✓ Generated {filename} ({size}x{size})')
        except Exception as e:
            print(f'✗ Failed to generate icon{size}.png: {str(e)}')
            exit(1)
    
    print('\n✨ All icons generated successfully!')
    print(f'📁 Icons saved to: {icons_dir}')

if __name__ == '__main__':
    main()

