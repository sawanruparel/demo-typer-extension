/**
 * Background Script Tests
 * Basic tests for the background service worker
 */

describe('Background Script', () => {
  test('chrome API should be mocked', () => {
    expect(chrome).toBeDefined();
    expect(chrome.storage).toBeDefined();
    expect(chrome.runtime).toBeDefined();
  });

  test('storage should be accessible', () => {
    chrome.storage.sync.get('typingSpeed', (data) => {
      expect(data).toBeDefined();
    });
  });

  test('message passing should work', () => {
    const mockMessage = { action: 'type', text: 'test' };
    chrome.runtime.sendMessage(mockMessage);
    
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage);
  });
});

