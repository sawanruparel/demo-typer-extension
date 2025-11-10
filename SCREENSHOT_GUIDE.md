# Chrome Web Store Screenshot Guide

## 📸 How to Capture Perfect Extension Screenshots

Chrome Web Store prefers screenshots that show your extension **in actual use** - with the popup open over a webpage. Here's how to capture them manually:

### Method 1: Manual Screenshot with Popup (RECOMMENDED)

**This is what Chrome Web Store reviewers want to see!**

#### Steps:

1. **Load the extension in Chrome:**
   ```bash
   # Option A: Load from build directory
   # 1. Open chrome://extensions/
   # 2. Enable "Developer mode"
   # 3. Click "Load unpacked"
   # 4. Select the /build directory
   
   # Option B: Load from root (for development)
   # Same steps, but select the project root directory
   ```

2. **Open a test page:**
   - Navigate to the demo page: `file:///path/to/demo-typer-extension/demo-page.html`
   - OR use any webpage with a text field (Google Docs, CodePen, etc.)

3. **Click the extension icon** in Chrome's toolbar
   - The popup will appear

4. **Take a screenshot:**
   - **Mac**: Press `Cmd + Shift + 4`, then press `Space` to capture the window
   - **Windows**: Press `Win + Shift + S` for Snipping Tool
   - **Linux**: Use your system's screenshot tool

5. **Capture these scenarios:**
   - ✅ Popup open over demo page
   - ✅ Popup open over a document/text editor
   - ✅ Popup open over code editor
   - ✅ Options page (chrome://extensions > Details > Extension options)
   - ✅ Typing in action (if possible)

#### Recommended Screenshot Sizes:
- Primary: **1280×800** (most important)
- Alternative: **640×400** (for smaller displays)

---

### Method 2: Use Automated Screenshots

The automated script generates comprehensive screenshots including contextual usage scenarios:

```bash
# Generate all screenshots
npm run generate-screenshots
```

**Generated files:**
- `screenshot_demo_page_*.png` - Demo page with extension
- `screenshot_popup_*.png` - Extension popup interface
- `screenshot_options_*.png` - Extension settings page
- `screenshot_typing_active_*.png` - Typing simulation in action
- `screenshot_editor_context_*.png` - Document editor with extension
- `screenshot_code_editor_*.png` - Code editor with extension
- `screenshot_features_*.png` - Features showcase

**Tip:** These provide a great base, but consider also capturing manual screenshots with the popup actually open over a webpage for the most authentic representation.

---

### Method 3: Use macOS Screenshot Utility (Mac Only)

For precise control:

1. Open **Screenshot.app** (Cmd + Shift + 5)
2. Select "Capture Selected Window"
3. Load extension and open popup
4. Click to capture just the browser window
5. Crop if needed in Preview

---

## 📋 Chrome Web Store Checklist

### Required Screenshots (3-5 total):

- [ ] **Screenshot 1**: Extension popup open over demo page (1280×800)
- [ ] **Screenshot 2**: Extension popup with text field focused (1280×800)  
- [ ] **Screenshot 3**: Extension options/settings page (1280×800)
- [ ] **Screenshot 4**: Code editor with extension active (optional, 1280×800)
- [ ] **Screenshot 5**: Document editor with extension (optional, 1280×800)

### Screenshot Requirements:
- ✅ Format: PNG or JPEG
- ✅ Size: 1280×800 or 640×400
- ✅ Maximum: 5 screenshots
- ✅ Show actual extension UI (not mockups)
- ✅ Include extension icon visible in toolbar (preferred)
- ✅ Show popup open (highly recommended)

---

## 🎯 Best Practices

### DO:
- ✅ Show the extension popup actually open
- ✅ Include the Chrome toolbar with your extension icon visible
- ✅ Use realistic example text/code
- ✅ Show the extension in different contexts (doc editor, code editor, etc.)
- ✅ Make sure text is readable (use good contrast)
- ✅ Show keyboard shortcuts if relevant

### DON'T:
- ❌ Use generic mockups without real extension UI
- ❌ Include personal information or real email addresses
- ❌ Show other unrelated extensions in toolbar
- ❌ Use low-quality or pixelated images
- ❌ Include browser chrome from other browsers
- ❌ Show error messages or broken states

---

## 🚀 Quick Start

**For the perfect Chrome Web Store screenshot:**

1. Build the extension:
   ```bash
   npm run build:skiptest
   ```

2. Load unpacked from `build/` directory in Chrome

3. Navigate to `demo-page.html` (use the file from build directory)

4. Click the extension icon to open popup

5. Position the popup nicely over the page content

6. Take screenshot: `Cmd + Shift + 4` → `Space` (Mac) or `Win + Shift + S` (Windows)

7. Ensure screenshot is 1280×800 (resize if needed)

8. Upload to Chrome Web Store!

---

## 📁 Example Screenshot Layout

```
┌─────────────────────────────────────────────────────┐
│ Chrome Browser Window (1280×800)                   │
│ ┌─────────────────────────────────────────────────┐│
│ │ [Browser Tabs & Toolbar with extension icon]    ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Your Demo/Test Page Content                     ││
│ │                                                  ││
│ │   ┌───────────────────────┐                     ││
│ │   │  Extension Popup      │                     ││
│ │   │  [Your UI here]       │                     ││
│ │   │  - Snippet input      │                     ││
│ │   │  - Speed slider       │                     ││
│ │   │  - Buttons, etc.      │                     ││
│ │   └───────────────────────┘                     ││
│ │                                                  ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Use the demo-page.html**: It's designed to look good in screenshots and explains the extension clearly

2. **Clean up your Chrome**: Close unnecessary tabs, hide other extensions for a clean look

3. **Set a nice viewport size**: Before screenshotting, resize browser to exactly 1280×800

4. **Test different scenarios**: Document editor, code editor, form filling - show versatility

5. **Add annotations after** (optional): Use tools like Skitch or Snagit to add arrows or highlights

6. **Keep it authentic**: Chrome Web Store prefers real screenshots over heavily edited ones

---

## 🛠️ Tools for Screenshot Editing

- **macOS**: Preview (built-in), Skitch, CleanShot X
- **Windows**: Paint, Snipping Tool, ShareX
- **Cross-platform**: GIMP, Photoshop, Figma

Use these to:
- Crop to exact 1280×800
- Add subtle highlights (optional)
- Remove sensitive information
- Compress file size if needed

---

## ✅ Final Checklist Before Upload

- [ ] Screenshots show real extension (not mockups)
- [ ] At least one shows popup open
- [ ] Images are 1280×800 or 640×400
- [ ] PNG or JPEG format
- [ ] File size under 5MB each
- [ ] No personal/sensitive information visible
- [ ] Text is clear and readable
- [ ] Extension icon visible in toolbar
- [ ] 3-5 screenshots total

---

**Ready to upload!** Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 🚀

