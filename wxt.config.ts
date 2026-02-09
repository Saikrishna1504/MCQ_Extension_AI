import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'MCQ Help Buddy',
    version: '2.0.0',
    description: 'Smart AI quiz solver - highlight text and get instant answers',
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
      default_title: 'MCQ Help Buddy'
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