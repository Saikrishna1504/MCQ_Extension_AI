import { defineBackground } from 'wxt/sandbox';
import browser from 'webextension-polyfill';

export default defineBackground(() => {
  console.log('🚀🚀🚀 BACKGROUND SCRIPT STARTED 🚀🚀🚀');
  
  // Background script for MCQ Answer Finder - Smart Quiz Solver
  browser.runtime.onInstalled.addListener(async () => {
    console.log('🚀 Quiz Solver background script installed');
    
    // Create context menu
    try {
      browser.contextMenus.create({
        id: "solve-with-ai",
        title: "🔍 Solve with AI",
        contexts: ["selection"],
        documentUrlPatterns: ["<all_urls>"]
      });
      console.log('✅ Context menu created successfully');
    } catch (error) {
      console.error('❌ Failed to create context menu:', error);
    }

    // Check if API key is set
    try {
      const result = await browser.storage.sync.get(['geminiApiKey']);
      if (!result.geminiApiKey) {
        console.log('⚠️ No API key found, opening popup');
        browser.action.openPopup();
      } else {
        console.log('✅ API key found in storage');
      }
    } catch (error) {
      console.error('❌ Failed to check API key:', error);
    }
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener((info, tab) => {
    console.log('🖱️🖱️🖱️ CONTEXT MENU CLICKED 🖱️🖱️🖱️');
    console.log('🖱️ Context menu clicked:', info);
    console.log('📝 Selected text:', info.selectionText);
    console.log('🆔 Tab ID:', tab.id);
    
    if (info.menuItemId === "solve-with-ai" && info.selectionText) {
      console.log('🔍 Sending solve request for text:', info.selectionText.substring(0, 50) + '...');
      
      // Send selected text to content script
      browser.tabs.sendMessage(tab.id, {
        action: "solveQuestion",
        text: info.selectionText
      }).then(response => {
        console.log('✅ Message sent successfully, response:', response);
      }).catch(error => {
        console.error('❌ Failed to send message to content script:', error);
        
        // Try to inject content script if it's not loaded
        browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-scripts/content.js']
        }).then(() => {
          console.log('🔄 Content script injected, retrying message...');
          
          // Retry sending message
          setTimeout(() => {
            browser.tabs.sendMessage(tab.id, {
              action: "solveQuestion", 
              text: info.selectionText
            });
          }, 500);
        }).catch(injectError => {
          console.error('❌ Failed to inject content script:', injectError);
        });
      });
    } else {
      console.log('⚠️ Context menu clicked but no text selected');
    }
  });

  // Handle keyboard shortcuts
  browser.commands.onCommand.addListener(async (command) => {
    console.log('⌨️ Keyboard command triggered:', command);
    
    if (command === "solve-question") {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          console.log('🚀 Sending keyboard shortcut message to tab:', tabs[0].id);
          
          browser.tabs.sendMessage(tabs[0].id, {
            action: "solveSelectedText"
          }).then(response => {
            console.log('✅ Keyboard shortcut message sent, response:', response);
          }).catch(error => {
            console.error('❌ Failed to send keyboard shortcut message:', error);
          });
        }
      } catch (error) {
        console.error('❌ Failed to query tabs:', error);
      }
    }
  });

  // Handle messages from content script
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request);
    
    if (request.action === 'getApiKey') {
      // Handle async operation
      (async () => {
        try {
          const result = await browser.storage.sync.get(['geminiApiKey']);
          console.log('🔑 Sending API key response:', result.geminiApiKey ? 'key found' : 'no key');
          sendResponse({ apiKey: result.geminiApiKey });
        } catch (error) {
          console.error('❌ Failed to get API key:', error);
          sendResponse({ error: error.message });
        }
      })();
      return true; // Will respond asynchronously
    }
    
    // Handle other messages
    sendResponse({ success: true });
    return true;
  });
  
  console.log('🎯🎯🎯 BACKGROUND SCRIPT SETUP COMPLETE 🎯🎯🎯');
}); 