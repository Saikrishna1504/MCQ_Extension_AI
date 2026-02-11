import { defineBackground } from 'wxt/utils/define-background';
import browser from 'webextension-polyfill';
import { CONFIG } from '../shared/config.js';
import { callAIAPI } from '../shared/api.js';

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
          // Popup couldn't be opened automatically; user can open it manually
        }
      }
    } catch (error) {
      console.error('Error checking API key setup:', error);
    }
  }

  async function ensureContentScript(tabId) {
    try {
      const manifest = browser.runtime.getManifest();
      const contentScripts = manifest.content_scripts || [];
      
      if (contentScripts.length > 0 && contentScripts[0].js) {
        const scriptPath = contentScripts[0].js[0];
        await browser.scripting.executeScript({
          target: { tabId },
          files: [scriptPath],
        });
        await new Promise(resolve => setTimeout(resolve, CONFIG.UI.CONTENT_SCRIPT_INJECT_DELAY));
      } else {
        await browser.scripting.executeScript({
          target: { tabId },
          files: ['content-scripts/content.js'],
        });
        await new Promise(resolve => setTimeout(resolve, CONFIG.UI.CONTENT_SCRIPT_INJECT_DELAY));
      }
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
        title: 'SmartBuddy+',
        message,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async function sendMessageToContentScript(tabId, message, retries = 2) {
    try {
      const response = await Promise.race([
        browser.tabs.sendMessage(tabId, message),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Message timeout')), 5000)
        )
      ]);
      if (response && response.success) {
        return response;
      }
      throw new Error('Invalid response from content script');
    } catch (error) {
      console.error(`❌ Error sending message (retries left: ${retries}):`, error.message);
      if (retries > 0) {
        try {
          await ensureContentScript(tabId);
          await new Promise(resolve => setTimeout(resolve, 500));
          return sendMessageToContentScript(tabId, message, retries - 1);
        } catch (injectError) {
          console.error('❌ Failed to inject content script:', injectError);
          throw error;
        }
      }
      throw error;
    }
  }

  browser.commands.onCommand.addListener(async (command) => {
    if (command === CONFIG.SHORTCUTS.SOLVE_QUESTION) {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]) {
          console.error('❌ No active tab found');
          await showErrorNotification('No active tab found. Please open a webpage first.');
          return;
        }
        
        const tabId = tabs[0].id;
        const tabUrl = tabs[0].url;
        
        if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('edge://') || tabUrl.startsWith('about:')) {
          console.error('❌ Cannot run on browser internal pages');
          await showErrorNotification('This extension cannot run on browser internal pages. Please open a regular webpage.');
          return;
        }
        
        try {
          await sendMessageToContentScript(tabId, {
            action: 'solveSelectedText',
          });
        } catch (error) {
          console.error('❌ Error sending message to content script:', error);
          await showErrorNotification(
            'Unable to process shortcut. Please refresh the page and try again.'
          );
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
    if (request.action === 'callCustomEndpoint') {
      (async () => {
        try {
          const result = await callAIAPI(
            request.questionText,
            request.customPrompt,
            request.apiKey,
            request.provider,
            request.images,
            request.isCodingMode
          );
          sendResponse({ success: true, result });
        } catch (error) {
          console.error('❌ Error calling custom endpoint from background:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
  });
});
