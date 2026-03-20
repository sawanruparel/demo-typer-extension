describe('Background Script', () => {
  let commandListener;

  beforeEach(() => {
    jest.resetModules();
    chrome.storage.local.__reset();
    chrome.commands.onCommand.addListener.mockClear();
    chrome.tabs.query.mockClear();
    chrome.tabs.sendMessage.mockClear();
    chrome.scripting.executeScript.mockClear();

    require('../background.js');
    commandListener = chrome.commands.onCommand.addListener.mock.calls[0][0];
  });

  test('registers a keyboard shortcut listener on load', () => {
    expect(typeof commandListener).toBe('function');
  });

  test('falls back to defaultSnippet when type_last_snippet has no lastSnippet', async () => {
    chrome.storage.local.__setData({
      extensionEnabled: true,
      lastSnippet: '',
      defaultSnippet: 'Fallback from options',
      lastSpeed: 14,
      lastMistakes: false,
      mistakeRate: 3,
      cursorRestore: true,
      forceType: false,
      useKeyEvents: true
    });

    await commandListener('type_last_snippet');

    expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(1, expect.objectContaining({
      type: 'DEMO_TYPER/TYPE',
      text: 'Fallback from options',
      cps: 14
    }));
  });

  test('shows an error when no shortcut snippet is configured', async () => {
    chrome.storage.local.__setData({
      extensionEnabled: true,
      lastSnippet: '',
      defaultSnippet: ''
    });

    await commandListener('type_last_snippet');

    expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(1, expect.objectContaining({
      type: 'DEMO_TYPER/ERROR'
    }));
  });
});
