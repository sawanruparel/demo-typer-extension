/* global chrome */
const snippetEl = document.getElementById('snippet');
const snippetNameEl = document.getElementById('snippetName');
const speedEl = document.getElementById('speed');
const cpsOut = document.getElementById('cpsOut');
const mistakesEl = document.getElementById('mistakes');
const mistakeRateEl = document.getElementById('mistakeRate');
const mistakeRateOut = document.getElementById('mistakeRateOut');
const mistakeRateRow = document.getElementById('mistakeRateRow');
const cursorRestoreEl = document.getElementById('cursorRestore');
const forceTypeEl = document.getElementById('forceType');
const useKeyEventsEl = document.getElementById('useKeyEvents');
const extensionEnabledEl = document.getElementById('extensionEnabled');
const debugLoggingEl = document.getElementById('debugLogging');
const typeBtn = document.getElementById('typeBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const saveSnippetBtn = document.getElementById('saveSnippetBtn');
const clearBtn = document.getElementById('clearBtn');
const pickElementBtn = document.getElementById('pickElementBtn');
const snippetListEl = document.getElementById('snippetList');
const noSnippetsEl = document.getElementById('noSnippets');
const debugLogEl = document.getElementById('debugLog');
const clearLogBtn = document.getElementById('clearLogBtn');
const statusBadgeEl = document.getElementById('statusBadge');
const charCountEl = document.getElementById('charCount');

let currentSnippetId = null;

// Tab Switching Logic
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    // Remove active class from all nav items and tab contents
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    // Add active class to clicked nav item
    item.classList.add('active');

    // Show corresponding tab content
    const tabId = item.getAttribute('data-tab');
    document.getElementById(`tab-${tabId}`).classList.add('active');
  });
});

// Character Count
snippetEl.addEventListener('input', () => {
  charCountEl.textContent = `${snippetEl.value.length} chars`;
});

// Debug logging functions
function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '#4ade80', // green-400
    success: '#22c55e', // green-500
    error: '#ef4444', // red-500
    warning: '#f59e0b', // amber-500
    debug: '#60a5fa' // blue-400
  };

  const logEntry = document.createElement('div');
  logEntry.style.color = colors[type] || colors.info;
  logEntry.style.marginBottom = '4px';
  logEntry.textContent = `[${timestamp}] ${message}`;

  // Remove "waiting" message if present
  if (debugLogEl.querySelector('[style*="#666"]')) {
    debugLogEl.innerHTML = '';
  }

  debugLogEl.appendChild(logEntry);
  debugLogEl.scrollTop = debugLogEl.scrollHeight;

  console.log(`[Demo Typer] ${message}`);
}

clearLogBtn.addEventListener('click', () => {
  debugLogEl.innerHTML = '<div style="color: #666;">Log cleared.</div>';
});

speedEl.addEventListener('input', () => {
  cpsOut.textContent = speedEl.value;
});

mistakeRateEl.addEventListener('input', () => {
  mistakeRateOut.textContent = mistakeRateEl.value;
});

// Persist settings when they change
mistakesEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ lastMistakes: mistakesEl.checked });
  addLog(`Settings saved: mistakes=${mistakesEl.checked}`, 'debug');
  // Show/hide mistake rate slider
  mistakeRateRow.style.display = mistakesEl.checked ? 'block' : 'none';
});

mistakeRateEl.addEventListener('change', async () => {
  const rate = parseInt(mistakeRateEl.value, 10);
  await chrome.storage.local.set({ mistakeRate: rate });
  addLog(`Settings saved: mistakeRate=${rate}%`, 'debug');
});

cursorRestoreEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ cursorRestore: cursorRestoreEl.checked });
  addLog(`Settings saved: cursorRestore=${cursorRestoreEl.checked}`, 'debug');
});

forceTypeEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ forceType: forceTypeEl.checked });
  addLog(`Settings saved: forceType=${forceTypeEl.checked}`, 'debug');
});

useKeyEventsEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ useKeyEvents: useKeyEventsEl.checked });
  addLog(`Settings saved: useKeyEvents=${useKeyEventsEl.checked}`, 'debug');
});

speedEl.addEventListener('change', async () => {
  const speed = parseInt(speedEl.value, 10);
  await chrome.storage.local.set({ lastSpeed: speed });
  addLog(`Settings saved: speed=${speed}`, 'debug');
});

extensionEnabledEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ extensionEnabled: extensionEnabledEl.checked });
  addLog(`Extension ${extensionEnabledEl.checked ? 'ENABLED' : 'DISABLED'}`, extensionEnabledEl.checked ? 'success' : 'warning');
  // Update button states
  updateButtonStates();
});

debugLoggingEl.addEventListener('change', async () => {
  await chrome.storage.local.set({ debugLogging: debugLoggingEl.checked });
  addLog(`Debug logging ${debugLoggingEl.checked ? 'enabled' : 'disabled'}`, 'debug');
});

function updateButtonStates() {
  const enabled = extensionEnabledEl.checked;
  typeBtn.disabled = !enabled;
  pickElementBtn.disabled = !enabled;

  // Update status badge
  if (!enabled) {
    statusBadgeEl.innerHTML = '<span class="status-dot disabled"></span><span>Disabled</span>';
  } else {
    statusBadgeEl.innerHTML = '<span class="status-dot active"></span><span>Ready</span>';
  }
}

async function ensureContentScriptLoaded(tabId) {
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tabId, { type: 'DEMO_TYPER/PING' });
    return true;
  } catch (error) {
    // Content script not loaded, try to inject it
    addLog('Content script not loaded, injecting...', 'warning');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['contentScript.js']
      });
      addLog('✓ Content script injected successfully', 'success');
      // Wait a moment for it to initialize
      await new Promise(r => setTimeout(r, 100));
      return true;
    } catch (injectError) {
      addLog(`ERROR: Cannot inject content script: ${injectError.message}`, 'error');
      addLog(`This page may not allow extensions`, 'error');
      return false;
    }
  }
}

async function send(message) {
  addLog(`Getting active tab...`, 'debug');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    addLog(`ERROR: No active tab found`, 'error');
    return;
  }
  addLog(`Active tab: ${tab.id} (${tab.url})`, 'debug');

  // Ensure content script is loaded
  const isLoaded = await ensureContentScriptLoaded(tab.id);
  if (!isLoaded) {
    addLog(`❌ Cannot use extension on this page`, 'error');
    alert('Demo Typer cannot run on this page.\n\nThis page may be:\n- A Chrome system page (chrome://)\n- A restricted page (chrome web store, etc.)\n- A page that blocks extensions\n\nTry refreshing the page (F5) or use a different page.');
    throw new Error('Content script injection failed');
  }

  addLog(`Sending message: ${message.type}`, 'info');
  try {
    const response = await chrome.tabs.sendMessage(tab.id, message);
    addLog(`Response: ${JSON.stringify(response)}`, 'debug');
    return response;
  } catch (error) {
    addLog(`ERROR sending message: ${error.message}`, 'error');
    throw error;
  }
}

async function loadSnippets() {
  const { savedSnippets } = await chrome.storage.local.get({ savedSnippets: [] });
  return savedSnippets;
}

async function saveSnippets(snippets) {
  await chrome.storage.local.set({ savedSnippets: snippets });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function renderSnippetList() {
  const snippets = await loadSnippets();
  snippetListEl.innerHTML = '';

  if (snippets.length === 0) {
    noSnippetsEl.style.display = 'block';
    return;
  }

  noSnippetsEl.style.display = 'none';

  snippets.forEach((snippet, index) => {
    const div = document.createElement('div');
    div.className = 'snippet-item';
    if (snippet.id === currentSnippetId) {
      div.classList.add('active');
    }

    const headerDiv = document.createElement('div');
    headerDiv.className = 'snippet-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'snippet-name';
    nameSpan.textContent = snippet.name || `Snippet ${index + 1}`;

    // Show hotkey badge for first 3 snippets
    if (index < 3) {
      const badge = document.createElement('span');
      badge.className = 'kbd';
      badge.textContent = `⌘⇧${index + 1}`;
      headerDiv.appendChild(nameSpan);
      headerDiv.appendChild(badge);
    } else {
      headerDiv.appendChild(nameSpan);
    }

    const previewLine = document.createElement('div');
    previewLine.className = 'snippet-preview';
    previewLine.textContent = snippet.text.substring(0, 60) + (snippet.text.length > 60 ? '...' : '');

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '8px';
    actionsDiv.style.marginTop = '8px';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn btn-secondary btn-sm';
    loadBtn.textContent = 'Load';
    loadBtn.onclick = (e) => {
      e.stopPropagation();
      loadSnippet(snippet.id);
      // Switch to type tab
      document.querySelector('[data-tab="type"]').click();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSnippet(snippet.id);
    };

    actionsDiv.appendChild(loadBtn);
    actionsDiv.appendChild(deleteBtn);

    div.appendChild(headerDiv);
    div.appendChild(previewLine);
    div.appendChild(actionsDiv);

    // Make whole card clickable to load
    div.onclick = () => {
      loadSnippet(snippet.id);
      document.querySelector('[data-tab="type"]').click();
    };

    snippetListEl.appendChild(div);
  });
}

async function loadSnippet(id) {
  const snippets = await loadSnippets();
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    currentSnippetId = id;
    snippetEl.value = snippet.text;
    snippetNameEl.value = snippet.name || '';
    charCountEl.textContent = `${snippet.text.length} chars`;
    await renderSnippetList();
  }
}

async function deleteSnippet(id) {
  const snippets = await loadSnippets();
  const filtered = snippets.filter(s => s.id !== id);
  await saveSnippets(filtered);
  if (currentSnippetId === id) {
    currentSnippetId = null;
    snippetEl.value = '';
    snippetNameEl.value = '';
    charCountEl.textContent = '0 chars';
  }
  await renderSnippetList();
}

async function init() {
  addLog('Popup opened', 'info');

  const { lastSnippet, lastSpeed, lastMistakes, mistakeRate, cursorRestore, forceType, useKeyEvents, extensionEnabled, debugLogging } = await chrome.storage.local.get({
    lastSnippet: '', lastSpeed: 12, lastMistakes: false, mistakeRate: 3, cursorRestore: true, forceType: false, useKeyEvents: true, extensionEnabled: true, debugLogging: true
  });

  snippetEl.value = lastSnippet;
  charCountEl.textContent = `${lastSnippet.length} chars`;
  speedEl.value = lastSpeed;
  cpsOut.textContent = lastSpeed;
  mistakesEl.checked = lastMistakes;
  mistakeRateEl.value = mistakeRate;
  mistakeRateOut.textContent = mistakeRate;
  mistakeRateRow.style.display = lastMistakes ? 'block' : 'none';
  cursorRestoreEl.checked = cursorRestore;
  forceTypeEl.checked = forceType;
  useKeyEventsEl.checked = useKeyEvents;
  extensionEnabledEl.checked = extensionEnabled;
  debugLoggingEl.checked = debugLogging;

  // Update button states based on extension enabled status
  updateButtonStates();

  if (!extensionEnabled) {
    addLog('⚠️ Extension is currently DISABLED', 'warning');
  }

  addLog(`Loaded settings: speed=${lastSpeed}, mistakes=${lastMistakes}, mistakeRate=${mistakeRate}%, forceType=${forceType}, enabled=${extensionEnabled}, debug=${debugLogging}`, 'debug');

  await renderSnippetList();

  // Check what's focused on the page
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      // Try to ensure content script is loaded (but don't block if it fails)
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'DEMO_TYPER/PING' });
        // Script is loaded, check focus
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'DEMO_TYPER/GET_FOCUS_INFO' });
        if (response && response.focused) {
          addLog(`✓ Focused element: <${response.tagName}> type="${response.inputType}"`, 'success');
          if (response.hasShadowDOM) {
            addLog(`✓ Shadow DOM detected - found editable inside!`, 'success');
          }
        } else if (response) {
          if (response.hasShadowDOM && response.shadowEditableFound) {
            addLog(`🌟 Shadow DOM detected in <${response.tagName}>`, 'info');
            addLog(`✓ Found editable element inside shadow DOM!`, 'success');
            if (forceType) {
              addLog(`✓ Force Type enabled - will use shadow DOM element`, 'success');
            } else {
              addLog(`💡 TIP: Enable "Force type" to use shadow DOM element`, 'info');
            }
          } else if (forceType) {
            addLog(`⚠ Non-editable element: <${response.tagName || 'none'}>`, 'warning');
            addLog(`✓ Force Type is enabled - will type anyway`, 'success');
          } else {
            addLog(`⚠ WARNING: No editable element focused!`, 'warning');
            addLog(`Current focus: <${response.tagName || 'none'}>`, 'warning');
            addLog(`💡 TIP: Enable "Force type" or use "Pick Target Element"`, 'info');
          }
        }
      } catch (error) {
        addLog(`⚠ Content script not yet loaded - will auto-inject when typing`, 'warning');
        addLog(`💡 Or try refreshing the page (F5)`, 'info');
      }
    }
  } catch (error) {
    addLog(`Could not check focus: ${error.message}`, 'debug');
  }
}

saveSnippetBtn.addEventListener('click', async () => {
  const text = snippetEl.value.trim();
  if (!text) {
    alert('Please enter some text to save');
    return;
  }

  const name = snippetNameEl.value.trim();
  const snippets = await loadSnippets();

  if (currentSnippetId) {
    // Update existing snippet
    const index = snippets.findIndex(s => s.id === currentSnippetId);
    if (index >= 0) {
      snippets[index] = { ...snippets[index], name, text };
    }
  } else {
    // Create new snippet
    const newSnippet = {
      id: generateId(),
      name: name || `Snippet ${snippets.length + 1}`,
      text
    };
    snippets.push(newSnippet);
    currentSnippetId = newSnippet.id;
  }

  await saveSnippets(snippets);
  await renderSnippetList();

  // Switch to snippets tab to see result
  document.querySelector('[data-tab="snippets"]').click();
});

clearBtn.addEventListener('click', () => {
  currentSnippetId = null;
  snippetEl.value = '';
  snippetNameEl.value = '';
  charCountEl.textContent = '0 chars';
  renderSnippetList();
});

typeBtn.addEventListener('click', async () => {
  // Check if extension is enabled
  if (!extensionEnabledEl.checked) {
    addLog('ERROR: Extension is disabled', 'error');
    alert('Demo Typer is currently disabled.\n\nPlease enable it in the "Extension Settings" section.');
    return;
  }

  const text = snippetEl.value;
  if (!text) {
    addLog('ERROR: No text to type', 'error');
    alert('Please enter some text to type');
    return;
  }

  addLog(`=== STARTING TYPING ===`, 'info');
  addLog(`Text length: ${text.length} chars`, 'info');
  addLog(`Speed: ${speedEl.value} cps`, 'info');
  addLog(`Mistakes: ${mistakesEl.checked}`, 'info');
  if (mistakesEl.checked) {
    addLog(`Mistake rate: ${mistakeRateEl.value}%`, 'info');
  }
  addLog(`Cursor restore: ${cursorRestoreEl.checked}`, 'info');
  addLog(`Force type: ${forceTypeEl.checked}`, 'info');
  addLog(`Use keyboard events: ${useKeyEventsEl.checked}`, 'info');

  const cps = parseInt(speedEl.value, 10);
  const mistakes = mistakesEl.checked;
  const mistakeRate = parseInt(mistakeRateEl.value, 10);
  const cursorRestore = cursorRestoreEl.checked;
  const forceType = forceTypeEl.checked;
  const useKeyEvents = useKeyEventsEl.checked;

  await chrome.storage.local.set({
    lastSnippet: text,
    lastSpeed: cps,
    lastMistakes: mistakes,
    mistakeRate: mistakeRate,
    cursorRestore,
    forceType,
    useKeyEvents
  });
  addLog('Saved settings to storage', 'debug');

  try {
    const result = await send({
      type: 'DEMO_TYPER/TYPE',
      text,
      cps,
      mistakes,
      mistakeRate,
      cursorRestore,
      forceType,
      useKeyEvents
    });
    if (result && result.ok) {
      addLog('✓ Typing started successfully!', 'success');
    } else if (result && result.error) {
      addLog(`ERROR: ${result.error}`, 'error');
    }
  } catch (error) {
    addLog(`ERROR: ${error.message}`, 'error');
    return; // Don't close popup if there's an error
  }

  // Show pause button
  pauseBtn.style.display = 'flex'; // Changed from inline-block to flex for alignment
  pauseBtn.innerHTML = '<span>⏸ Pause</span>';
  pauseBtn.className = 'btn btn-warning';

  // Don't close popup immediately so user can see logs
  // setTimeout(() => window.close(), 500);
});

stopBtn.addEventListener('click', async () => {
  await send({ type: 'DEMO_TYPER/STOP' });
  pauseBtn.style.display = 'none';
});

pauseBtn.addEventListener('click', async () => {
  const isPaused = pauseBtn.textContent.includes('Resume');

  if (isPaused) {
    // Resume
    await send({ type: 'DEMO_TYPER/RESUME' });
    pauseBtn.innerHTML = '<span>⏸ Pause</span>';
    pauseBtn.className = 'btn btn-warning';
    addLog('Resuming typing...', 'info');
  } else {
    // Pause
    await send({ type: 'DEMO_TYPER/PAUSE' });
    pauseBtn.innerHTML = '<span>▶ Resume</span>';
    pauseBtn.className = 'btn btn-success'; // Changed to success color for resume
    addLog('Paused typing', 'info');
  }
});

pickElementBtn.addEventListener('click', async () => {
  // Check if extension is enabled
  if (!extensionEnabledEl.checked) {
    addLog('ERROR: Extension is disabled', 'error');
    alert('Demo Typer is currently disabled.\n\nPlease enable it in the "Extension Settings" section.');
    return;
  }

  addLog('Starting element picker...', 'info');
  addLog('Click on any element on the page to select it as the target', 'info');

  try {
    await send({ type: 'DEMO_TYPER/PICK_ELEMENT' });
    addLog('✓ Element picker activated', 'success');
    addLog('Click on target element, then reopen popup', 'info');
    window.close();
  } catch (error) {
    addLog(`ERROR: ${error.message}`, 'error');
  }
});

init();
