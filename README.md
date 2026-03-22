# 🎯 Demo Typer - Chrome Extension

> A powerful Chrome extension that simulates realistic human-like typing in web pages, **including support for shadow DOM and custom editors**.

[![Chrome](https://img.shields.io/badge/chrome-latest-blue)](https://www.google.com/chrome/)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## ✨ Features

- 🎬 **Realistic typing animation** - Variable speed with configurable mistake rate
- 💾 **Multiple snippets** - Save and quickly insert text with keyboard shortcuts  
- ⚡ **Keyboard shortcuts** - `Cmd+Shift+1/2/3` for instant typing
- 🌟 **Shadow DOM support** - Works with Google Vertex AI, Notion, ProseMirror editors
- 🎯 **Element picker** - Visually select target elements
- 🔧 **Force type mode** - Override detection for custom editors
- 📊 **Debug logging** - Comprehensive logs for troubleshooting

---

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable** "Developer mode" (top-right toggle)
4. **Click** "Load unpacked"
5. **Select** the project directory

### Usage

1. **Click** in any input field on a web page
2. **Click** the Demo Typer extension icon
3. **Type or paste** your text
4. **Click** "Type into page" or use `Cmd+Shift+Y`
5. **Watch** the magic happen! ✨

### Keyboard Shortcuts

- `Cmd+Shift+Y` - Type last used text
- `Cmd+Shift+1` - Type saved snippet #1
- `Cmd+Shift+2` - Type saved snippet #2
- `Cmd+Shift+3` - Type saved snippet #3

---

## 🎓 Use Cases

### Software Demos
Create polished presentations with realistic typing animations

### Customer Support
Quickly insert common responses with keyboard shortcuts

### Testing & QA
Automate form filling and text entry

### Training Videos
Professional tutorials with smooth, consistent typing

### Sales Presentations
Demo software features with polished animations

---

## 🌟 What's Special?

### Shadow DOM Support

Works with modern web applications that use Shadow DOM:

```
✅ Google Vertex AI Search
✅ Notion
✅ ProseMirror editors
✅ Monaco Editor
✅ Custom web components
✅ Nested shadow DOMs (up to 5 levels)
```

### Intelligent Element Detection

```
Priority 1: Editor components (ProseMirror, Monaco)
Priority 2: ContentEditable elements  
Priority 3: Standard inputs (text, email, textarea)
Priority 4: Force type mode (any focused element)
```

### Multiple Insertion Methods

```javascript
✅ Standard input.value
✅ document.execCommand('insertText')  
✅ Shadow root selection API
✅ Keyboard event dispatching
✅ Direct text node insertion (fallback)
```

---

## 📚 Documentation

### Current Project Docs
- [README](./README.md) - Project overview and setup
- [Privacy Policy](./PRIVACY_POLICY.md) - Data handling and permissions
- [Screenshot Guide](./SCREENSHOT_GUIDE.md) - Chrome Web Store image guidance
- [Scripts README](./scripts/README.md) - Asset generation utilities

---

## 🧪 Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run end-to-end extension tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Current Test Coverage

- Automated tests are currently lightweight and focused on core command flows.
- Playwright E2E tests cover the unpacked extension flow on a local demo page, including popup snippet saving and shadow DOM typing.
- The popup smoke test opens the action popup with `chrome.action.openPopup()`, which verifies the real popup surface without depending on brittle toolbar-click automation.
- Run `npm test` before packaging changes.
- Run `npm run test:e2e` when you change popup behavior, background command routing, or typing/injection logic.
- Manual verification in Chrome is still recommended for popup behavior, keyboard shortcuts, and shadow DOM editors.

---

## 🚢 Chrome Web Store Release Automation

The repo now includes a three-part release flow:

1. API publish script for package upload and release submission
2. Dashboard automation script for browser-only listing tasks after login
3. Public verification script for the live store page

### Commands

```bash
# 1. Build, upload, and submit through the Chrome Web Store API
npm run publish:webstore:api

# 2. Open a persistent browser session for dashboard-only work
npm run publish:webstore:dashboard

# 3. Verify the live public listing
npm run publish:webstore:verify
```

### Required environment

```bash
export CHROME_WEBSTORE_PUBLISHER_ID="your-publisher-id"
```

These scripts automatically load a repo-local `.env` file if present, so you can keep these values there instead of exporting them in your shell.

For authentication, provide one of these:

```bash
# Option 1: direct bearer token
export CHROME_WEBSTORE_ACCESS_TOKEN="..."

# Option 2: service account JSON file
export CHROME_WEBSTORE_SERVICE_ACCOUNT_JSON_PATH="/absolute/path/to/service-account.json"

# Option 3: service account fields
export CHROME_WEBSTORE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
export CHROME_WEBSTORE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Option 4: OAuth refresh-token flow
export CHROME_WEBSTORE_CLIENT_ID="..."
export CHROME_WEBSTORE_CLIENT_SECRET="..."
export CHROME_WEBSTORE_REFRESH_TOKEN="..."
```

### Script Roles

```bash
# API publish: build/upload/publish through the official API
npm run publish:webstore:api -- --skip-build --wait-published

# Dashboard helper: reuse a persistent login profile and best-effort upload listing assets
npm run publish:webstore:dashboard -- --tab store-listing

# Public verifier: confirm the live page and optionally wait for the API to report the new version
npm run publish:webstore:verify -- --wait-live --open

# Backward-compatible alias for the API step
npm run publish:webstore
```

Notes:

- All three scripts default to this extension's existing item id: `jhmaebpcljoabnanhifemljjpdlllapp`.
- The dashboard helper stores login state under `.chrome-webstore-profile/`, which is gitignored.
- The dashboard helper is best-effort automation for UI-only tasks like screenshots and promo images; because it depends on dashboard markup, it may occasionally need selector updates.
- The public verification step checks the store page title and canonical URL, and when API credentials are available it can also verify that the manifest version is the live published version.
- If the submission is still in review when the timeout expires, rerun `npm run publish:webstore:verify -- --wait-live` after approval.

---

## 🎨 Demo

### Try It Out

Open `demo-page.html` in your browser (with extension installed) to test:

- ✅ Regular inputs (text, email, password, search)
- ✅ Textarea
- ✅ ContentEditable div
- ✅ **Shadow DOM editor** (ProseMirror-like structure)
- ✅ **Nested shadow DOM** (3 levels deep)

### Real-World Sites

Test on actual applications:
- [Google Vertex AI Search](https://vertexaisearch.cloud.google.com/) - **Works perfectly!** ✅
- [Notion](https://notion.so) - ContentEditable support
- GitHub Copilot Chat
- Any site with custom editors

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Chrome Extension                   │
├─────────────────────────────────────────────┤
│  Popup UI  →  Background  →  Content Script │
│  (HTML/JS)    (Service      (Typing Engine) │
│               Worker)        + Shadow DOM    │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│              Web Page                        │
│  • Regular inputs                            │
│  • ContentEditable                           │
│  • Shadow DOM editors                        │
│  • Nested shadow DOMs                        │
└─────────────────────────────────────────────┘
```

### Key Files

| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| `contentScript.js` | Main typing engine | 667 | Shadow DOM traversal, text insertion |
| `popup.js` | UI & snippet management | 406 | CRUD operations, settings |
| `background.js` | Service worker | 122 | Keyboard shortcuts, auto-injection |
| `popup.html` | Extension UI | 98 | Snippet list, settings, debug panel |

---

## 🔧 Configuration

### Settings

- **Typing Speed** - 1-50 characters per second (default: 12)
- **Simulate Mistakes** - Random typos and corrections (default: off)
- **Mistake Rate** - Percentage of characters that will be mistyped (0-15%, default: 3%)
- **Restore Cursor** - Return cursor to original position (default: on)
- **Force Type** - Override element detection (default: off)
- **Keyboard Events** - Dispatch keyboard events (default: on)

### Keyboard Shortcuts

Customize shortcuts at `chrome://extensions/shortcuts`

---

## 🤝 Contributing

We welcome contributions! See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for:

- Setup instructions
- Code style guidelines
- Testing requirements
- Pull request process

### Areas for Contribution

- 🎯 Support for additional editor types
- 🐛 Bug fixes and improvements
- 📝 Documentation enhancements
- ✅ Test coverage expansion
- 🌍 Internationalization

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~1,500 |
| Test Coverage | 85% |
| Tests Passing | 64/64 |
| Documentation Pages | 10 |
| Supported Editor Types | 10+ |
| Max Shadow DOM Depth | 5 levels |

---

## 🐛 Known Issues

### Browser Limitations

- **Firefox** - Not supported (Chrome/Chromium only)
- **Some protected pages** - Cannot inject on `chrome://` URLs
- **Cross-origin iframes** - Limited access due to security

### Workarounds

- Use "Force Type" mode for custom editors
- Use Element Picker if auto-detection fails
- Enable "Keyboard Events" for compatibility

See [DEBUGGING.md](./docs/DEBUGGING.md) for solutions.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **ProseMirror** - Shadow DOM structure inspiration
- **Chrome Extension Samples** - API usage examples
- **Jest** - Testing framework
- **JSDOM** - DOM testing environment

---

## 📞 Support

- **Documentation:** See [/docs](./docs) folder
- **Issues:** [GitHub Issues](https://github.com/sawanruparel/demo-typer-extension/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sawanruparel/demo-typer-extension/discussions)

---

## 🔮 Roadmap

### Version 2.0 (Planned)
- [ ] Cloud sync via Chrome Storage Sync
- [ ] Import/export snippets (JSON)
- [ ] Variable typing profiles (beginner/expert)
- [ ] Rich text formatting support
- [ ] Snippet templates with variables

### Version 2.1 (Future)
- [ ] Multi-language support
- [ ] Typing analytics (WPM, accuracy)
- [ ] More editor-specific handlers
- [ ] Accessibility improvements

---

<div align="center">

**Built with ❤️ for developers, presenters, and power users**

[Documentation](./docs) • [Demo](./demo-page.html) • [Tests](./tests) • [License](./LICENSE)

</div>
