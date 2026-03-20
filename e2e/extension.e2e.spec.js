const { test, expect } = require('./fixtures');

const LAST_SNIPPET_COMMAND = 'type_last_snippet';
const FIRST_SNIPPET_COMMAND = 'type_snippet_1';

test.describe('Demo Typer extension', () => {
  test('opens the action popup surface', async ({
    context,
    serviceWorker
  }) => {
    const hostPage = await context.newPage();
    await hostPage.goto('http://127.0.0.1:4173/demo-page.html');
    await hostPage.bringToFront();

    await serviceWorker.evaluate(() => chrome.action.openPopup());

    await expect.poll(async () => {
      return serviceWorker.evaluate(async () => {
        const contexts = await chrome.runtime.getContexts({ contextTypes: ['POPUP'] });
        return contexts.map((context) => ({
          contextType: context.contextType,
          documentUrl: context.documentUrl
        }));
      });
    }).toEqual([
      expect.objectContaining({
        contextType: 'POPUP',
        documentUrl: expect.stringContaining('/popup.html')
      })
    ]);

    await hostPage.close();
  });

  test('types the default shortcut snippet into a plain input', async ({
    page,
    demoPageUrl,
    setExtensionStorage,
    runExtensionCommand
  }) => {
    await setExtensionStorage({
      defaultSnippet: 'Typed from options',
      lastSnippet: '',
      lastSpeed: 40,
      extensionEnabled: true
    });

    await page.goto(demoPageUrl);
    await page.locator('#username').click();

    await runExtensionCommand(LAST_SNIPPET_COMMAND, page.url());

    await expect.poll(async () => page.locator('#username').inputValue()).toBe('Typed from options');
  });

  test('saves a snippet through the popup UI and types it with shortcut 1', async ({
    page,
    demoPageUrl,
    openPopupPage,
    runExtensionCommand
  }) => {
    const popupPage = await openPopupPage();
    await popupPage.locator('#snippetName').fill('Greeting');
    await popupPage.locator('#snippet').fill('Saved from popup UI');
    await popupPage.locator('#saveSnippetBtn').click();
    await expect(popupPage.locator('.snippet-item')).toHaveCount(1);
    await popupPage.close();

    await page.goto(demoPageUrl);
    await page.locator('#bio').click();

    await runExtensionCommand(FIRST_SNIPPET_COMMAND, page.url());

    await expect.poll(async () => page.locator('#bio').inputValue()).toBe('Saved from popup UI');
  });

  test('types into the nested shadow DOM editor with the last-snippet shortcut', async ({
    page,
    demoPageUrl,
    setExtensionStorage,
    runExtensionCommand
  }) => {
    await setExtensionStorage({
      lastSnippet: 'Shadow typing works',
      lastSpeed: 40,
      lastMistakes: false,
      mistakeRate: 0,
      cursorRestore: true,
      forceType: false,
      useKeyEvents: true,
      extensionEnabled: true
    });

    await page.goto(demoPageUrl);

    const nestedEditor = page.locator('outer-wrapper middle-wrapper inner-editor .nested-editor');
    await nestedEditor.evaluate((element) => {
      element.innerHTML = '';
      element.focus();

      const selection = element.getRootNode().getSelection
        ? element.getRootNode().getSelection()
        : window.getSelection();

      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });

    await runExtensionCommand(LAST_SNIPPET_COMMAND, page.url());

    await expect.poll(async () => nestedEditor.innerText()).toContain('Shadow typing works');
  });
});
