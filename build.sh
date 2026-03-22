#!/bin/bash

# Demo Typer - Build Script for Chrome Web Store Submission
# This script creates a production-ready ZIP file for publishing

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Version from manifest.json
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
BUILD_DIR="build"
ZIP_NAME="demo-typer-v${VERSION}.zip"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Demo Typer - Build Script           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Run tests
if [ "$BUILD_SKIP_TEST" = "1" ]; then
    echo -e "${BLUE}[1/7]${NC} Skipping tests..."
    echo -e "      ${YELLOW}⚠${NC} Tests skipped (BUILD_SKIP_TEST=1)"
else
    echo -e "${BLUE}[1/7]${NC} Running tests..."
    if npm test > /dev/null 2>&1; then
        echo -e "      ${GREEN}✓${NC} All tests passed"
    else
        echo -e "      ${RED}✗${NC} Tests failed. Fix errors before building."
        exit 1
    fi
fi

# Step 2: Clean previous build
echo -e "${BLUE}[2/7]${NC} Cleaning previous build..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    echo -e "      ${GREEN}✓${NC} Removed old build directory"
else
    echo -e "      ${GREEN}✓${NC} No previous build found"
fi

# Step 3: Create build directory
echo -e "${BLUE}[3/7]${NC} Creating build directory..."
mkdir -p "$BUILD_DIR"
echo -e "      ${GREEN}✓${NC} Build directory created"

# Step 4: Copy production files
echo -e "${BLUE}[4/7]${NC} Copying production files..."

# Core extension files
cp manifest.json "$BUILD_DIR/"
cp background.js "$BUILD_DIR/"
cp contentScript.js "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.css "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp options.html "$BUILD_DIR/"

# Icons
cp -r icons "$BUILD_DIR/"

# Documentation (optional, but good to include)
cp README.md "$BUILD_DIR/"
cp LICENSE "$BUILD_DIR/"
cp PRIVACY_POLICY.md "$BUILD_DIR/"

# Demo page (optional)
cp demo-page.html "$BUILD_DIR/"

echo -e "      ${GREEN}✓${NC} Production files copied"

# Step 5: List excluded files
echo -e "${BLUE}[5/7]${NC} Excluding development files..."
echo -e "      ${YELLOW}ⓘ${NC} Excluded: node_modules/, tests/, coverage/"
echo -e "      ${YELLOW}ⓘ${NC} Excluded: package.json, package-lock.json"
echo -e "      ${YELLOW}ⓘ${NC} Excluded: .git/, .gitignore"
echo -e "      ${YELLOW}ⓘ${NC} Excluded: build scripts and docs"
echo -e "      ${GREEN}✓${NC} Development files excluded"

# Step 6: Create ZIP file
echo -e "${BLUE}[6/7]${NC} Creating ZIP archive..."
cd "$BUILD_DIR"
zip -r -q "../$ZIP_NAME" .
cd ..
echo -e "      ${GREEN}✓${NC} ZIP file created: $ZIP_NAME"

# Step 7: Display results
echo -e "${BLUE}[7/7]${NC} Build summary..."
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        BUILD SUCCESSFUL! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  📦 Package: ${GREEN}${ZIP_NAME}${NC}"
echo -e "  📊 Version: ${GREEN}${VERSION}${NC}"
echo -e "  📁 Size:    ${GREEN}$(du -h "$ZIP_NAME" | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review the package: unzip -l $ZIP_NAME"
echo -e "  2. Test in Chrome: Load unpacked from '$BUILD_DIR/'"
echo -e "  3. Go to: https://chrome.google.com/webstore/devconsole"
echo -e "  4. Click 'New Item' and upload: $ZIP_NAME"
echo -e "  5. Review README.md, PRIVACY_POLICY.md, and store assets before submission"
echo ""
echo -e "${BLUE}Files included in package:${NC}"
cd "$BUILD_DIR"
find . -type f | sed 's|^./|  • |' | sort
cd ..
echo ""
echo -e "${GREEN}Ready to publish to Chrome Web Store!${NC} ✨"
echo ""
