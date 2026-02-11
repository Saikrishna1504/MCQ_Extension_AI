import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'SmartBuddy+',
    version: '3.0.0',
    description: 'SmartBuddy+ - AI-powered quiz and coding helper for MCQs and problems',
    permissions: [
      'activeTab',
      'storage',
      'scripting',
      'notifications'
    ],
    host_permissions: [
      "https://generativelanguage.googleapis.com/*",
      "https://api.openai.com/*",
      "https://*/*",
      "http://*/*"
    ],
    action: {
      default_popup: 'popup/index.html',
      default_title: 'SmartBuddy+'
    },
    commands: {
      "solve-question": {
        "suggested_key": {
          "default": "Ctrl+Shift+S",
          "mac": "Command+Shift+S"
        },
        "description": "Solve highlighted question instantly"
      }
    },
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}); 
