# Privacy Policy for Demo Typer Extension

**Last Updated:** October 21, 2025

## Overview

Demo Typer is committed to protecting your privacy. This privacy policy explains how the extension handles your data.

## Data Collection

Demo Typer does **NOT** collect, store, transmit, or share any personal information or user data outside of your local device.

### What We Store Locally

The extension stores the following data **locally** on your device using Chrome's Storage API:

1. **Text Snippets** - The text snippets you save in the extension
2. **Snippet Names** - Custom names you assign to your snippets
3. **Settings** - Your preferences including:
   - Typing speed (characters per second)
   - Mistake simulation preference
   - Cursor restoration preference
   - Force type mode preference
   - Keyboard events preference
4. **Last Used Text** - The most recent text you typed for quick reuse

### How Data is Stored

- All data is stored **locally** in your browser using `chrome.storage.local`
- Data never leaves your device
- Data is only accessible to the Demo Typer extension
- Data persists across browser sessions until you manually delete it

## Data Usage

The extension uses your stored data solely for the following purposes:

1. **Typing Simulation** - To type your saved text into web pages when you trigger the extension
2. **User Experience** - To remember your settings and preferences
3. **Snippet Management** - To display and manage your saved text snippets

## Third-Party Access

- **NO third-party services** are used
- **NO analytics** or tracking tools are integrated
- **NO data** is transmitted to external servers
- **NO advertisements** are displayed

## Permissions Explained

The extension requests the following permissions:

### activeTab
- **Purpose:** To access the currently active tab when you click the extension icon
- **Usage:** Required to insert typed text into the focused field on the current page
- **Data Access:** Only when you explicitly trigger the extension

### scripting
- **Purpose:** To inject the typing engine into web pages
- **Usage:** Required for the extension to function on the page you're viewing
- **Data Access:** No data is collected; only typing functionality is enabled

### storage
- **Purpose:** To save your snippets and settings locally
- **Usage:** All data stays on your device in Chrome's local storage
- **Data Access:** Only the extension can read this data

### host_permissions (<all_urls>)
- **Purpose:** To work on any website you visit
- **Usage:** Required because the extension is designed to work on all websites
- **Data Access:** The extension only interacts with the specific page element you're typing into

## User Control

You have full control over your data:

1. **Delete Snippets** - Use the delete button next to each snippet in the extension popup
2. **Clear All Data** - Uninstall the extension to remove all stored data
3. **Manual Data Removal** - You can manually clear extension data in Chrome settings:
   - Go to `chrome://settings/siteData`
   - Search for "Demo Typer"
   - Click "Remove"

## Content Script Behavior

The extension injects a content script into web pages to enable typing functionality:

- The script only activates when you explicitly trigger the extension
- It detects the focused input element (including shadow DOM elements)
- It simulates keyboard events to type text
- It does not read, collect, or transmit any data from the web page
- It does not monitor your browsing activity
- It does not track your keystrokes or typing patterns

## Data Security

- All data is stored using Chrome's secure storage API
- Data is isolated and only accessible to the Demo Typer extension
- No encryption is needed as data never leaves your device

## Children's Privacy

Demo Typer does not knowingly collect any information from children. Since we don't collect any personal information at all, the extension is safe for users of all ages.

## Changes to This Policy

If we make changes to this privacy policy, we will:

1. Update the "Last Updated" date at the top
2. Notify users through the extension update notes
3. Require user acknowledgment for major changes

## Open Source

Demo Typer is open source. You can review the complete source code to verify our privacy claims:

- GitHub Repository: [https://github.com/sawanruparel/demo-typer-extension](https://github.com/sawanruparel/demo-typer-extension)
- All code is publicly auditable

## Contact Us

If you have questions about this privacy policy or the extension's data practices:

- **GitHub Issues:** [https://github.com/sawanruparel/demo-typer-extension/issues](https://github.com/sawanruparel/demo-typer-extension/issues)
- **Email:** support@yourdomain.com (Update this with your actual email)

## Your Consent

By using the Demo Typer extension, you consent to this privacy policy.

## Summary

**In Plain English:**

- ✅ All your data stays on your device
- ✅ We don't collect, send, or sell any data
- ✅ No tracking, no analytics, no third parties
- ✅ You can delete your data anytime
- ✅ The extension only works when you trigger it
- ✅ Open source - you can verify everything

**We believe in privacy by design. Your data is yours alone.**

---

**Demo Typer Team**

