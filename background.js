/* global chrome */

function log(message) {
  console.log(`[Demo Typer Background] ${message}`);
}

async function ensureContentScriptLoaded(tabId) {
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tabId, { type: 'DEMO_TYPER/PING' });
    return true;
  } catch (error) {
    // Content script not loaded, try to inject it
    log('Content script not loaded, injecting...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['contentScript.js']
      });
      log('✓ Content script injected successfully');
      // Wait a moment for it to initialize
      await new Promise(r => setTimeout(r, 100));
      return true;
    } catch (injectError) {
      log(`ERROR: Cannot inject content script: ${injectError.message}`);
      return false;
    }
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  log(`Keyboard shortcut triggered: ${command}`);
  
  // Check if extension is enabled
  const { extensionEnabled } = await chrome.storage.local.get({ extensionEnabled: true });
  if (!extensionEnabled) {
    log('⚠ Extension is disabled - ignoring keyboard shortcut');
    return;
  }
  
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  if (!tab?.id) {
    log('ERROR: No active tab found');
    return;
  }
  
  log(`Active tab: ${tab.id} - ${tab.url}`);
  
  // Ensure content script is loaded
  const isLoaded = await ensureContentScriptLoaded(tab.id);
  if (!isLoaded) {
    log('ERROR: Cannot inject content script on this page');
    return;
  }

  if (command === 'type_last_snippet') {
    log('Processing type_last_snippet command');
    try {
      const { lastSnippet, lastSpeed, lastMistakes, mistakeRate, cursorRestore, forceType, useKeyEvents } = await chrome.storage.local.get({
        lastSnippet: '', lastSpeed: 12, lastMistakes: false, mistakeRate: 3, cursorRestore: true, forceType: false, useKeyEvents: true
      });
      await chrome.tabs.sendMessage(tab.id, {
        type: 'DEMO_TYPER/TYPE',
        text: lastSnippet || '',
        cps: lastSpeed || 12,
        mistakes: !!lastMistakes,
        mistakeRate: mistakeRate || 3,
        cursorRestore: !!cursorRestore,
        forceType: !!forceType,
        useKeyEvents: useKeyEvents !== false
      });
      log('Command sent successfully');
    } catch (error) {
      log(`ERROR: ${error.message}`);
      log('Content script may not be loaded on this page. Try refreshing the page.');
    }
    return;
  }

  // Handle type_snippet_1, type_snippet_2, type_snippet_3
  const snippetMatch = command.match(/^type_snippet_(\d+)$/);
  if (snippetMatch) {
    const snippetNumber = parseInt(snippetMatch[1], 10);
    const snippetIndex = snippetNumber - 1;
    
    log(`Processing snippet #${snippetNumber} command`);
    
    try {
      const { savedSnippets, lastSpeed, lastMistakes, mistakeRate, cursorRestore, forceType, useKeyEvents } = await chrome.storage.local.get({
        savedSnippets: [],
        lastSpeed: 12,
        lastMistakes: false,
        mistakeRate: 3,
        cursorRestore: true,
        forceType: false,
        useKeyEvents: true
      });
      
      log(`Found ${savedSnippets.length} saved snippets`);

      if (snippetIndex >= 0 && snippetIndex < savedSnippets.length) {
        const snippet = savedSnippets[snippetIndex];
        log(`Typing snippet #${snippetNumber}: "${snippet.name || 'Unnamed'}" (${snippet.text.length} chars)`);
        
        await chrome.tabs.sendMessage(tab.id, {
          type: 'DEMO_TYPER/TYPE',
          text: snippet.text || '',
          cps: lastSpeed || 12,
          mistakes: !!lastMistakes,
          mistakeRate: mistakeRate || 3,
          cursorRestore: !!cursorRestore,
          forceType: !!forceType,
          useKeyEvents: useKeyEvents !== false
        });
        log('Command sent successfully');
      } else {
        log(`ERROR: Snippet #${snippetNumber} not found (only ${savedSnippets.length} snippets saved)`);
        // Show notification if snippet doesn't exist
        await chrome.tabs.sendMessage(tab.id, {
          type: 'DEMO_TYPER/ERROR',
          message: `Snippet #${snippetNumber} not found. Please save it first in the popup.`
        });
      }
    } catch (error) {
      log(`ERROR: ${error.message}`);
      log('Content script may not be loaded on this page. Try refreshing the page.');
    }
  }
});

log('Background script loaded and ready');
