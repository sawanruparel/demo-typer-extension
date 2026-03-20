# AGENTS.md

This file gives coding agents the minimum project context needed to work safely in this repository.

## Project Summary

- Project: `demo-typer-extension`
- Type: Chrome extension (`manifest_version: 3`)
- Stack: plain HTML/CSS/JavaScript, no bundler, Jest for tests
- Primary goal: simulate realistic typing into regular inputs, contenteditable surfaces, and custom/shadow-DOM editors

## Published Extension

- This repo backs a live Chrome Web Store listing: `Demo Typer - Realistic Typing Simulator`
- Store URL: `https://chromewebstore.google.com/detail/demo-typer-realistic-typi/jhmaebpcljoabnanhifemljjpdlllapp`
- Extension ID: `jhmaebpcljoabnanhifemljjpdlllapp`
- Verified against the live listing on March 19, 2026:
  - Store version shown: `1.0.0`
  - Listing "Updated" date shown: `November 12, 2025`
- Treat user-facing changes as production changes, since this codebase is not just a local demo project.

## Main Files

- `manifest.json`: extension entrypoint, permissions, commands, service worker
- `contentScript.js`: typing engine and page interaction logic
- `popup.html` + `popup.js`: popup UI, settings, saved snippets, debug log
- `background.js`: keyboard shortcut handling and content-script bootstrapping
- `options.html`: extension settings page
- `demo-page.html`: local manual testing page
- `tests/*.test.js`: Jest coverage for core behaviors
- `build.sh`: packaging script for Chrome Web Store submission

## Working Style For This Repo

- Keep changes lightweight and framework-free unless the user explicitly asks for a larger refactor.
- Preserve the current architecture: popup -> background -> content script.
- Prefer editing source files in the repo root over introducing new tooling.
- Treat `build/` and generated assets in `promo-images/` as build/output artifacts; do not regenerate or edit them unless the task calls for it.
- Avoid changing extension permissions in `manifest.json` unless the task requires it. If permissions change, explain why.

## Common Commands

```bash
npm test
npm run test:watch
npm run test:coverage
npm run build
npm run build:skiptest
```

## Validation Expectations

- Run `npm test` after meaningful code changes when feasible.
- For behavior changes in typing, popup actions, shortcuts, or content-script injection, also do a manual sanity pass:
  1. Load the repo as an unpacked extension in Chrome.
  2. Open `demo-page.html`.
  3. Verify popup actions and at least one keyboard shortcut.
  4. If relevant, verify a contenteditable or shadow-DOM target still works.
- Note that the current Jest suite is fairly lightweight, so manual verification matters for UI/integration changes.

## Code Conventions

- Match the existing plain-JS style and naming patterns.
- Keep browser APIs compatible with Chrome extension MV3.
- Reuse existing storage keys in `chrome.storage.local` when possible instead of inventing near-duplicates.
- Prefer small, focused helpers over broad rewrites.
- Add comments only where behavior is non-obvious, especially around injection, focus handling, and editor/shadow-DOM logic.

## Practical Guardrails

- Do not add a bundler, TypeScript migration, or UI framework unless explicitly requested.
- Do not check in secrets or environment-specific paths.
- If you touch packaging or store-submission assets, keep `build.sh`, `manifest.json`, and generated asset expectations aligned.
- Be careful with changes to extension name, description, permissions, privacy posture, screenshots, and promo assets because they can affect store compliance and listing accuracy.
- If a change affects keyboard shortcuts, permissions, or content-script injection, call that out clearly in the final summary.
