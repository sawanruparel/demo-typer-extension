// Content script: types text into the currently focused editable element with a human-like animation.
// VERSION: 2024-10-21-v5-smart-recursive
let currentAbort = null;
let isPaused = false;
let manuallySelectedElement = null;
let extensionEnabled = true;
let debugLoggingEnabled = true;

// Load settings on initialization
chrome.storage.local.get({ extensionEnabled: true, debugLogging: true }, (result) => {
  extensionEnabled = result.extensionEnabled;
  debugLoggingEnabled = result.debugLogging;
  console.log(`[Demo Typer v5] Extension enabled: ${extensionEnabled}, Debug: ${debugLoggingEnabled}`);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.extensionEnabled) {
      extensionEnabled = changes.extensionEnabled.newValue;
      console.log(`[Demo Typer v5] Extension ${extensionEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
    if (changes.debugLogging) {
      debugLoggingEnabled = changes.debugLogging.newValue;
      console.log(`[Demo Typer v5] Debug logging ${debugLoggingEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
  }
});

function log(message, type = 'info') {
  if (!debugLoggingEnabled) return;
  const prefix = '[Demo Typer v5]';
  console.log(`${prefix} ${message}`);
}

// Log version on load
console.log('[Demo Typer v5] ✓ Script loaded - smart recursive shadow DOM search');

function findEditableInShadowDOM(element, depth = 0) {
  try {
    // Check if element has shadow DOM
    if (!element || !element.shadowRoot) return null;

    if (depth === 0) {
      log(`Checking shadow DOM of <${element.tagName}>`);
    } else {
      log(`  ${'→'.repeat(depth)} Checking nested shadow DOM of <${element.tagName}>`);
    }

    // Look for common editable elements in shadow DOM
    const selectors = [
      '[contenteditable="true"]',
      'input[type="text"]',
      'input[type="search"]',
      'input[type="email"]',
      'input:not([type])',
      'textarea',
      '.ProseMirror[contenteditable]',
      '.ql-editor[contenteditable]',
      '[role="textbox"]'
    ];

    for (const selector of selectors) {
      const found = element.shadowRoot.querySelector(selector);
      if (found) {
        log(`✓ Found editable in shadow DOM: <${found.tagName}> class="${found.className}"`);
        return found;
      }
    }

    // If not found, recursively search nested shadow DOMs (max depth 3)
    if (depth < 3) {
      const shadowElements = element.shadowRoot.querySelectorAll('*');
      for (const child of shadowElements) {
        if (child.shadowRoot) {
          const nested = findEditableInShadowDOM(child, depth + 1);
          if (nested) return nested;
        }

        // Also check for specific editor components
        const editorTags = ['ucs-prosemirror-editor', 'prosemirror-editor', 'monaco-editor', 'code-editor'];
        if (editorTags.includes(child.tagName.toLowerCase())) {
          log(`  Found editor component: <${child.tagName}>`);
          if (child.shadowRoot) {
            const nestedEditor = findEditableInShadowDOM(child, depth + 1);
            if (nestedEditor) return nestedEditor;
          }
        }
      }
    }

    if (depth === 0) {
      log('No editable element found in shadow DOM (checked recursively)');
    }
    return null;
  } catch (error) {
    log(`Error checking shadow DOM: ${error.message}`);
    return null;
  }
}

function getFocusedEditable() {
  const el = document.activeElement;
  log(`Checking focused element: ${el ? el.tagName : 'none'}`);

  if (!el) {
    log('No element is focused');
    return null;
  }

  const tagName = el.tagName;
  const inputType = el.type || '';

  log(`Focused element: <${tagName}> type="${inputType}" contentEditable="${el.contentEditable}"`);

  const isInput = el.tagName === 'INPUT' && /^(text|search|email|url|tel|number|password)?$/i.test(el.type || 'text');
  const isTextarea = el.tagName === 'TEXTAREA';
  const isContentEditable = el.isContentEditable;

  log(`isInput: ${isInput}, isTextarea: ${isTextarea}, isContentEditable: ${isContentEditable}`);

  if (isInput || isTextarea || isContentEditable) {
    log('✓ Element is editable!');
    return el;
  }

  // Check if element has shadow DOM with editable content inside
  // Look for the CLOSEST/MOST SPECIFIC shadow DOM first (direct children of focused element)
  try {
    const shadowEditable = findEditableInDirectShadowDOM(el);
    if (shadowEditable) {
      log('✓ Found editable element inside shadow DOM!');
      return shadowEditable;
    }
  } catch (error) {
    log(`Shadow DOM check failed: ${error.message}`);
  }

  log('✗ Element is NOT editable');
  return null;
}

// Find editable elements by searching shadow DOM intelligently
// Prioritizes editor components and stops at the first one found
function findEditableInDirectShadowDOM(element, depth = 0, visited = new Set()) {
  if (!element || !element.shadowRoot || visited.has(element)) return null;
  visited.add(element);

  if (depth === 0) {
    log(`🔍 Smart shadow DOM search for editor starting from <${element.tagName}>`);
  }

  const indent = '  '.repeat(depth);

  // FIRST PRIORITY: Look for editor components with contenteditable inside
  const allElements = element.shadowRoot.querySelectorAll('*');
  log(`${indent}Scanning ${allElements.length} elements at depth ${depth}...`);

  for (const child of allElements) {
    const tagLower = child.tagName.toLowerCase();

    // Check if it's an editor component
    if (tagLower.includes('prosemirror-editor') || tagLower.includes('monaco-editor')) {
      log(`${indent}✨ Found EDITOR component: <${child.tagName}>`);
      if (child.shadowRoot) {
        const editable = child.shadowRoot.querySelector('[contenteditable="true"]');
        if (editable) {
          log(`${indent}✓ SUCCESS! Found contenteditable in <${child.tagName}>: <${editable.tagName}> class="${editable.className}"`);
          return editable;
        }
      }
    }

    // If this child has shadow DOM, search it recursively (but limit depth)
    if (child.shadowRoot && depth < 5) {
      const found = findEditableInDirectShadowDOM(child, depth + 1, visited);
      if (found) return found;
    }
  }

  // SECOND PRIORITY: Look for contenteditable elements directly in this shadow root
  const contentEditables = element.shadowRoot.querySelectorAll('[contenteditable="true"]');
  if (contentEditables.length > 0) {
    log(`${indent}✓ Found ${contentEditables.length} contenteditable element(s) at depth ${depth}`);
    return contentEditables[0];
  }

  if (depth === 0) {
    log(`✗ No editor found in shadow DOM tree`);
  }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function dispatchKeyboardEvents(el, char) {
  // Dispatch realistic keyboard events that custom handlers can catch
  const keydownEvent = new KeyboardEvent('keydown', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    charCode: char.charCodeAt(0),
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true,
    composed: true
  });

  const keypressEvent = new KeyboardEvent('keypress', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    charCode: char.charCodeAt(0),
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true,
    composed: true
  });

  const keyupEvent = new KeyboardEvent('keyup', {
    key: char,
    code: `Key${char.toUpperCase()}`,
    charCode: char.charCodeAt(0),
    keyCode: char.charCodeAt(0),
    which: char.charCodeAt(0),
    bubbles: true,
    cancelable: true,
    composed: true
  });

  const keydownResult = el.dispatchEvent(keydownEvent);
  const keypressResult = el.dispatchEvent(keypressEvent);
  const keyupResult = el.dispatchEvent(keyupEvent);

  // Log first character to show events are being dispatched
  if (char === char && Math.random() < 0.05) { // Log ~5% of chars to avoid spam
    log(`Dispatched keyboard events for '${char}' (keydown prevented: ${!keydownResult})`);
  }
}

async function typeIntoElement(el, text, cps = 12, { mistakes = false, mistakeRate = 3, cursorRestore = true, useKeyEvents = true } = {}) {
  if (!el) {
    log('ERROR: typeIntoElement called with null element');
    return;
  }

  log(`typeIntoElement starting: ${text.length} chars at ${cps} cps`);
  log(`Using keyboard events: ${useKeyEvents}`);

  // Enable keyboard event monitoring to see what the page receives
  if (useKeyEvents) {
    enableKeyEventLogging();
  }

  el.focus();
  log('Element focused');

  const delayBase = 1000 / Math.max(1, cps);
  log(`Delay per character: ~${delayBase.toFixed(0)}ms`);

  // Save selection/caret
  let originalSel = null;
  if ('selectionStart' in el) {
    originalSel = { start: el.selectionStart, end: el.selectionEnd };
  } else {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      originalSel = sel.getRangeAt(0).cloneRange();
    }
  }

  const abort = { cancelled: false };
  currentAbort = abort;

  const typeChar = async (ch) => {
    if (abort.cancelled) throw new Error('aborted');

    // Dispatch keyboard events if requested (for custom handlers)
    if (useKeyEvents) {
      dispatchKeyboardEvents(el, ch);
    }

    if ('selectionStart' in el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value || '';
      const newVal = val.slice(0, start) + ch + val.slice(end);
      el.value = newVal;
      const newPos = start + ch.length;
      el.setSelectionRange(newPos, newPos);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ch }));
    } else if (el.isContentEditable) {
      // For shadow DOM elements, we need to use the shadow root's selection
      const root = el.getRootNode();
      const sel = root.getSelection ? root.getSelection() : window.getSelection();

      if (!sel) {
        log(`⚠️ No selection available for contentEditable element`);
        return;
      }

      // If no range exists, create one at the end of the element
      if (sel.rangeCount === 0) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false); // collapse to end
        sel.removeAllRanges();
        sel.addRange(range);
        log(`Created new selection range in element`);
      }

      // Delete current selection if any
      if (!sel.isCollapsed) {
        document.execCommand('delete', false);
      }

      // Insert text at cursor
      const inserted = document.execCommand('insertText', false, ch);

      if (!inserted) {
        // Fallback: directly insert text node if execCommand fails
        log(`⚠️ execCommand failed, using direct insertion`);
        const textNode = document.createTextNode(ch);
        const range = sel.getRangeAt(0);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);

        // Dispatch input event manually
        el.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: ch
        }));
      }
    }
    // Slightly variable delay per character to feel natural
    const variance = delayBase * 0.35;
    await sleep(randomBetween(delayBase - variance, delayBase + variance));
  };

  log(`Starting character loop for ${text.length} characters`);
  if (useKeyEvents) {
    log(`✓ Keyboard events ENABLED - dispatching keydown/keypress/keyup for each character`);
  } else {
    log(`Keyboard events DISABLED - only direct text insertion`);
  }

  try {
    for (let i = 0; i < text.length; i++) {
      // Check for pause
      while (isPaused) {
        if (abort.cancelled) throw new Error('aborted');
        await sleep(100);
      }

      const ch = text[i];

      // Log progress every 20 characters
      if (i > 0 && i % 20 === 0) {
        log(`Typed ${i}/${text.length} characters`);
      }

      // Simulated mistakes: occasionally press wrong char, then backspace.
      // mistakeRate is a percentage (0-15), so convert to probability (0-0.15)
      const mistakeProbability = mistakeRate / 100;
      if (mistakes && Math.random() < mistakeProbability && ch !== '\n') {
        const wrongChar = 'asdfghjklqwertyuiopzxcvbnm'[Math.floor(Math.random() * 26)];
        await typeChar(wrongChar);
        // Backspace
        if ('selectionStart' in el) {
          const pos = el.selectionStart;
          if (pos > 0) {
            const val = el.value;
            el.value = val.slice(0, pos - 1) + val.slice(pos);
            el.setSelectionRange(pos - 1, pos - 1);
            el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
          }
        } else if (el.isContentEditable) {
          document.execCommand('delete', false);
        }
        await sleep(delayBase * 0.5);
      }

      if (ch === '\n') {
        if ('selectionStart' in el) {
          await typeChar('\n');
        } else if (el.isContentEditable) {
          document.execCommand('insertLineBreak');
          await sleep(delayBase);
        }
      } else {
        await typeChar(ch);
      }
    }
    log(`✓ Finished typing all ${text.length} characters`);
  } catch (e) {
    log(`ERROR during typing: ${e.message}`);
  } finally {
    if (cursorRestore) {
      if ('selectionStart' in el && originalSel) {
        el.setSelectionRange(originalSel.start, originalSel.end);
      } else if (originalSel) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(originalSel);
        }
      }
    }
    if (currentAbort === abort) currentAbort = null;
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  log(`Received message: ${msg?.type}`);

  // Ping check to see if content script is loaded (always respond to this)
  if (msg?.type === 'DEMO_TYPER/PING') {
    sendResponse({ ok: true, loaded: true, enabled: extensionEnabled });
    return true;
  }

  // Check if extension is enabled for all other commands
  if (!extensionEnabled && msg?.type !== 'DEMO_TYPER/PING') {
    log('⚠ Extension is disabled - ignoring message');
    sendResponse({ ok: false, error: 'extension-disabled', message: 'Demo Typer is currently disabled' });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/GET_FOCUS_INFO') {
    const el = document.activeElement;
    if (!el) {
      log('No element focused');
      sendResponse({ focused: false, tagName: 'none' });
      return true;
    }

    const isEditable = getFocusedEditable();
    let hasShadowDOM = false;
    let shadowEditable = null;

    try {
      hasShadowDOM = !!el.shadowRoot;
      shadowEditable = hasShadowDOM ? findEditableInDirectShadowDOM(el) : null;
    } catch (error) {
      log(`Error checking shadow DOM in GET_FOCUS_INFO: ${error.message}`);
    }

    sendResponse({
      focused: !!isEditable,
      tagName: el.tagName,
      inputType: el.type || '',
      contentEditable: el.contentEditable,
      id: el.id || '',
      className: el.className || '',
      hasShadowDOM: hasShadowDOM,
      shadowEditableFound: !!shadowEditable
    });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/TYPE') {
    // Reset pause state on new type request
    isPaused = false;

    log(`=== TYPING REQUEST ===`);
    log(`Text length: ${(msg.text || '').length}`);
    log(`Speed: ${msg.cps || 12} cps`);
    log(`Mistakes: ${msg.mistakes}`);
    if (msg.mistakes) {
      log(`Mistake rate: ${msg.mistakeRate || 3}%`);
    }
    log(`Force type: ${msg.forceType}`);
    log(`Use keyboard events: ${msg.useKeyEvents}`);

    // Try manually selected element first, then focused element
    let el = manuallySelectedElement || getFocusedEditable();

    // If force type is enabled and no editable found, try shadow DOM then use current focus
    if (!el && msg.forceType) {
      const focusedEl = manuallySelectedElement || document.activeElement;

      // Try to find editable in shadow DOM first using targeted search
      try {
        const shadowEl = findEditableInDirectShadowDOM(focusedEl);
        if (shadowEl) {
          el = shadowEl;
          log(`=== SHADOW DOM DETECTED ===`);
          log(`Found editable inside: <${focusedEl.tagName}>`);
          log(`Using shadow DOM element: <${el.tagName}> class="${el.className}"`);
        } else {
          el = focusedEl;
          log(`=== FORCE TYPE MODE ACTIVE ===`);
          log(`Using element: <${el?.tagName || 'none'}> ${el?.id ? 'id="' + el.id + '"' : ''} ${el?.className ? 'class="' + el.className + '"' : ''}`);
          log(`⚠️ WARNING: Element is not standard editable - relying on keyboard events!`);
          log(`If nothing happens, the page may not have keyboard event listeners`);
        }
      } catch (error) {
        el = focusedEl;
        log(`Shadow DOM check failed: ${error.message}`);
        log(`=== FORCE TYPE MODE ACTIVE ===`);
        log(`Using element: <${el?.tagName || 'none'}>`);
      }
    } else if (msg.forceType && el) {
      log(`Force type enabled, but found editable element - using normal mode`);
    }

    if (!el) {
      log('ERROR: No element to type into!');
      const currentEl = document.activeElement;
      const errorMsg = `No target element found.\nCurrent focus: <${currentEl?.tagName || 'none'}>${currentEl?.id ? ' id="' + currentEl.id + '"' : ''}\n\nTry:\n- Clicking in an editable field\n- Using "Pick Target Element" button\n- Enabling "Force type" mode`;
      alert('Demo Typer: ' + errorMsg);
      log(errorMsg);
      sendResponse({ ok: false, error: 'no-target' });
      return true;
    }

    log(`Starting to type into: <${el.tagName}> ${el.id ? 'id="' + el.id + '"' : ''} ${el.className ? 'class="' + el.className + '"' : ''}`);
    log(`Element details: contentEditable=${el.contentEditable}, isContentEditable=${el.isContentEditable}`);

    typeIntoElement(el, msg.text || '', msg.cps || 12, {
      mistakes: !!msg.mistakes,
      mistakeRate: msg.mistakeRate || 3,
      cursorRestore: !!msg.cursorRestore,
      useKeyEvents: msg.useKeyEvents !== false // default true
    });
    log('Typing initiated successfully');
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/STOP') {
    log('Stop typing requested');
    if (currentAbort) {
      currentAbort.cancelled = true;
      log('Typing cancelled');
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/PAUSE') {
    log('Pause requested');
    isPaused = true;
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/RESUME') {
    log('Resume requested');
    isPaused = false;
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/ERROR') {
    log(`ERROR: ${msg.message}`);
    alert('Demo Typer: ' + (msg.message || 'An error occurred'));
    sendResponse({ ok: true });
    return true;
  }

  if (msg?.type === 'DEMO_TYPER/PICK_ELEMENT') {
    log('Element picker mode activated');
    startElementPicker();
    sendResponse({ ok: true });
    return true;
  }
});

// Element picker functionality
function startElementPicker() {
  log('Starting element picker...');

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'demo-typer-picker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999999;
    cursor: crosshair;
  `;

  // Create instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #111;
    color: #fff;
    padding: 15px 25px;
    border-radius: 10px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 1000000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  `;
  instructions.textContent = '📍 Click on any element to select it as typing target • Press ESC to cancel';

  // Highlight element under mouse
  let currentHighlight = null;
  let lastElement = null;

  function highlightElement(e) {
    if (e.target === overlay || e.target === instructions) return;

    if (lastElement !== e.target) {
      // Remove old highlight
      if (currentHighlight) {
        currentHighlight.remove();
      }

      // Add new highlight
      const rect = e.target.getBoundingClientRect();
      currentHighlight = document.createElement('div');
      currentHighlight.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid #00ff00;
        background: rgba(0, 255, 0, 0.1);
        z-index: 999998;
        pointer-events: none;
        box-sizing: border-box;
      `;
      document.body.appendChild(currentHighlight);
      lastElement = e.target;
    }
  }

  function selectElement(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.target === overlay || e.target === instructions) return;

    manuallySelectedElement = e.target;
    log(`Element selected: <${e.target.tagName}> ${e.target.id ? 'id="' + e.target.id + '"' : ''} ${e.target.className ? 'class="' + e.target.className + '"' : ''}`);

    // Show confirmation
    const confirmation = document.createElement('div');
    confirmation.style.cssText = instructions.style.cssText;
    confirmation.style.background = '#00aa00';
    confirmation.textContent = `✓ Selected: <${e.target.tagName}> - Open extension popup to type`;
    document.body.appendChild(confirmation);

    setTimeout(() => {
      confirmation.remove();
    }, 3000);

    cleanup();
  }

  function cleanup() {
    overlay.remove();
    instructions.remove();
    if (currentHighlight) currentHighlight.remove();
    document.removeEventListener('mousemove', highlightElement);
    document.removeEventListener('click', selectElement, true);
    document.removeEventListener('keydown', handleEscape);
    log('Element picker closed');
  }

  function handleEscape(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      log('Element picker cancelled');
      cleanup();
    }
  }

  document.body.appendChild(overlay);
  document.body.appendChild(instructions);
  document.addEventListener('mousemove', highlightElement);
  document.addEventListener('click', selectElement, true);
  document.addEventListener('keydown', handleEscape);

  log('Element picker ready - hover and click to select');
}

// Debug: Log keyboard events detected on the page
let keyEventLoggingEnabled = false;

function enableKeyEventLogging() {
  if (keyEventLoggingEnabled) return;
  keyEventLoggingEnabled = true;

  log('=== Keyboard event monitoring ENABLED ===');

  const logKeyEvent = (e) => {
    log(`🎹 Keypress detected: "${e.key}" on <${e.target.tagName}> (type: ${e.type}, bubbles: ${e.bubbles}, defaultPrevented: ${e.defaultPrevented})`);
  };

  document.addEventListener('keydown', logKeyEvent, true);
  document.addEventListener('keypress', logKeyEvent, true);
  document.addEventListener('keyup', logKeyEvent, true);
  document.addEventListener('input', (e) => {
    if (e.inputType === 'insertText' && e.data) {
      log(`📝 Input event detected: "${e.data}" on <${e.target.tagName}>`);
    }
  }, true);

  log('Listening for: keydown, keypress, keyup, input events');
}

// Log when content script loads
log('Content script loaded and ready');
log(`URL: ${window.location.href}`);
