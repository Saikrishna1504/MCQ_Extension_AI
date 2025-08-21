import { defineBackground } from 'wxt/sandbox';
import browser from 'webextension-polyfill';

export default defineBackground(() => {
  // Create context menu on install
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'quiz-solver-solve',
      title: 'Solve with AI 🔍',
      contexts: ['selection']
    });

    // Check if API key is set, open popup if not
    browser.storage.sync.get(['geminiApiKey']).then((result) => {
      if (!result.geminiApiKey) {
        browser.action.openPopup();
      }
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'quiz-solver-solve' && info.selectionText) {
      try {
        const response = await browser.tabs.sendMessage(tab.id, {
          action: 'solveQuestion',
          text: info.selectionText
        });

        if (!response.success) {
          // Content script not loaded yet, inject it
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-scripts/content.js']
          });

          // Retry after injection
          setTimeout(async () => {
            try {
              await browser.tabs.sendMessage(tab.id, {
                action: 'solveQuestion',
                text: info.selectionText
              });
            } catch (retryError) {
              console.error('❌ Failed to send message after content script injection:', retryError);
            }
          }, 100);
        }
      } catch (error) {
        console.error('❌ Error handling context menu click:', error);
      }
    }
  });

  // Handle keyboard shortcuts
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'solve-selected-text') {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          const response = await browser.tabs.sendMessage(tabs[0].id, {
            action: 'solveSelectedText'
          });
        }
      } catch (error) {
        console.error('❌ Error handling keyboard shortcut:', error);
      }
    }
  });

  // Handle API key requests from content script
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiKey') {
      browser.storage.sync.get(['geminiApiKey']).then((result) => {
        sendResponse({ apiKey: result.geminiApiKey });
      });
      return true;
    }
  });
}); 