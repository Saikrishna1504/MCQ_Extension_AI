import { defineBackground } from 'wxt/sandbox';
import browser from 'webextension-polyfill';

export default defineBackground(() => {
  console.log('🔍 Quiz Solver background script started');

  // Install event handler
  browser.runtime.onInstalled.addListener(() => {
    console.log('🚀 Quiz Solver extension installed');

    // Create context menu for right-click functionality
    browser.contextMenus.create({
      id: 'quiz-solver-solve',
      title: 'Solve with AI 🔍',
      contexts: ['selection']
    });

    // Check if API key exists and open popup if not
    browser.storage.sync.get(['geminiApiKey']).then((result) => {
      if (!result.geminiApiKey) {
        console.log('⚠️ No API key found, opening popup');
        browser.action.openPopup();
      }
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'quiz-solver-solve' && info.selectionText) {
      try {
        // Send message to content script to solve the selected text
        const response = await browser.tabs.sendMessage(tab.id, {
          action: 'solveQuestion',
          text: info.selectionText
        });

        if (!response.success) {
          // If content script isn't ready, inject it and retry
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-scripts/content.js']
          });

          // Retry sending the message
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

  // Handle keyboard shortcut
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

  // Handle messages from content script
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getApiKey') {
      // Get API key from storage
      browser.storage.sync.get(['geminiApiKey']).then((result) => {
        sendResponse({ apiKey: result.geminiApiKey });
      });
      return true; // Indicates we will send a response asynchronously
    }
  });

  console.log('✅ Quiz Solver background script setup complete');
}); 