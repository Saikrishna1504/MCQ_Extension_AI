import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'MCQ Answer Finder',
    version: '2.0.0',
    description: 'Smart AI quiz solver - highlight text, right-click, get instant answers',
    permissions: [
      'activeTab',
      'storage',
      'contextMenus',
      'scripting'
    ],
    host_permissions: [
      "https://generativelanguage.googleapis.com/*"
    ],
    action: {
      default_popup: 'popup/index.html',
      default_title: 'MCQ Answer Finder'
    },
    commands: {
      "solve-question": {
        "suggested_key": {
          "default": "Ctrl+Shift+Q",
          "mac": "Command+Shift+Q"
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