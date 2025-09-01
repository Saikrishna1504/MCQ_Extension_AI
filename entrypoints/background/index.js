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

  // Helper function to inject content script
  async function ensureContentScript(tabId) {
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['content-scripts/content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for initialization
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw error;
    }
  }

  // Helper function to show error notification
  async function showErrorNotification(message) {
    await browser.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon48.png',
      title: 'MCQ Help Buddy',
      message
    });
  }

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'quiz-solver-solve' && info.selectionText) {
      try {
        // Try sending message directly first
        try {
          const response = await browser.tabs.sendMessage(tab.id, {
            action: 'solveQuestion',
            text: info.selectionText
          });
          
          if (response && response.success) {
            return; // Message sent successfully
          }
        } catch (initialError) {
          // Expected error if content script isn't injected
          console.log('Initial message failed, will inject content script');
        }

        // Inject and initialize content script
        await ensureContentScript(tab.id);

        // Try sending message again
        await browser.tabs.sendMessage(tab.id, {
          action: 'solveQuestion',
          text: info.selectionText
        });

      } catch (error) {
        console.error('❌ Error handling context menu click:', error);
        await showErrorNotification('Unable to solve question. Please refresh the page and try again.');
      }
    }
  });

  // Handle keyboard shortcuts
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'solve-selected-text') {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          try {
            // Try sending message directly first
            await browser.tabs.sendMessage(tabs[0].id, { 
              action: 'solveSelectedText' 
            });
          } catch (initialError) {
            // Inject and initialize content script
            await ensureContentScript(tabs[0].id);
            
            // Try again
            await browser.tabs.sendMessage(tabs[0].id, { 
              action: 'solveSelectedText' 
            });
          }
        }
      } catch (error) {
        console.error('❌ Error handling keyboard shortcut:', error);
        await showErrorNotification('Unable to process shortcut. Please refresh the page and try again.');
      }
    }
  });

  // Handle API key requests from content script
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiKey') {
      browser.storage.sync.get(['geminiApiKey']).then((result) => {
        sendResponse({ apiKey: result.geminiApiKey });
      });
      return true; // Required for async response
    }
  });
});
