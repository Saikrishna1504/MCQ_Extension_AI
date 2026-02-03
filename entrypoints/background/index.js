import { defineBackground } from 'wxt/sandbox';
import browser from 'webextension-polyfill';
import { CONFIG } from '../shared/config.js';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    checkApiKeySetup();
  });

  async function checkApiKeySetup() {
    try {
      const result = await browser.storage.sync.get([CONFIG.STORAGE.API_KEY]);
      if (!result[CONFIG.STORAGE.API_KEY]) {
        try {
          await browser.action.openPopup();
        } catch (error) {
          console.log('Could not open popup automatically');
        }
      }
    } catch (error) {
      console.error('Error checking API key setup:', error);
    }
  }

  async function ensureContentScript(tabId) {
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['content-scripts/content.js'],
      });
      await new Promise(resolve => setTimeout(resolve, CONFIG.UI.CONTENT_SCRIPT_INJECT_DELAY));
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw error;
    }
  }

  async function showErrorNotification(message) {
    try {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'MCQ Help Buddy',
        message,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async function sendMessageToContentScript(tabId, message, retries = 1) {
    try {
      const response = await browser.tabs.sendMessage(tabId, message);
      if (response && response.success) {
        return response;
      }
      throw new Error('Invalid response from content script');
    } catch (error) {
      if (retries > 0) {
        await ensureContentScript(tabId);
        return sendMessageToContentScript(tabId, message, retries - 1);
      }
      throw error;
    }
  }

  browser.commands.onCommand.addListener(async (command) => {
    if (command === CONFIG.SHORTCUTS.SOLVE_QUESTION) {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          await sendMessageToContentScript(tabs[0].id, {
            action: 'solveSelectedText',
          });
        }
      } catch (error) {
        console.error('❌ Error handling keyboard shortcut:', error);
        await showErrorNotification(
          'Unable to process shortcut. Please refresh the page and try again.'
        );
      }
    }
  });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiKey') {
      browser.storage.sync.get([CONFIG.STORAGE.API_KEY]).then((result) => {
        sendResponse({ apiKey: result[CONFIG.STORAGE.API_KEY] });
      }).catch((error) => {
        console.error('Error getting API key:', error);
        sendResponse({ apiKey: null });
      });
      return true;
    }
    if (request.action === 'getProvider') {
      browser.storage.sync.get([CONFIG.STORAGE.PROVIDER]).then((result) => {
        sendResponse({ provider: result[CONFIG.STORAGE.PROVIDER] || CONFIG.PROVIDERS.GEMINI });
      }).catch((error) => {
        console.error('Error getting provider:', error);
        sendResponse({ provider: CONFIG.PROVIDERS.GEMINI });
      });
      return true;
    }
  });
});
