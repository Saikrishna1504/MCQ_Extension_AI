import browser from 'webextension-polyfill';

// Smart Quiz Solver - Popup Script
class QuizSolverPopup {
  constructor() {
    this.apiKeyInput = null;
    this.saveButton = null;
    this.statusDiv = null;
    this.testButton = null;
    this.isInitialized = false;
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
  }

  setupUI() {
    // Get DOM elements
    this.apiKeyInput = document.getElementById('apiKey');
    this.saveButton = document.getElementById('saveKey');
    this.statusDiv = document.getElementById('status');
    this.testButton = document.getElementById('testKey');

    if (!this.apiKeyInput || !this.saveButton || !this.statusDiv) {
      console.error('❌ Required DOM elements not found');
      return;
    }

    // Setup event listeners
    this.saveButton.addEventListener('click', () => this.saveApiKey());
    this.testButton?.addEventListener('click', () => this.testApiKey());
    this.apiKeyInput.addEventListener('input', () => this.clearStatus());

    // Load saved API key
    this.loadSavedApiKey();

    this.isInitialized = true;
  }

  async loadSavedApiKey() {
    try {
      const saved = await browser.storage.sync.get(['geminiApiKey']);
      
      if (saved.geminiApiKey) {
        this.apiKeyInput.value = saved.geminiApiKey;
        
        // Test the saved key
        const isValid = await this.validateApiKey(saved.geminiApiKey);
        if (isValid) {
          this.showStatus('✅ API key is valid and ready to use!', 'success');
        } else {
          this.showStatus('⚠️ Saved API key appears to be invalid', 'warning');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load saved API key:', error);
    }
  }

  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('❌ Please enter your API key', 'error');
      return;
    }

    this.showStatus('🔄 Saving API key...', 'loading');

    try {
      // Validate API key first
      const isValid = await this.validateApiKey(apiKey);
      
      if (!isValid) {
        this.showStatus('❌ Invalid API key. Please check and try again.', 'error');
        return;
      }

      // Save to storage
      await browser.storage.sync.set({ geminiApiKey: apiKey });
      this.showStatus('✅ API key saved successfully!', 'success');
      
      // Auto-close popup after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to save API key:', error);
      this.showStatus('❌ Failed to save API key', 'error');
    }
  }

  async testApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('❌ Please enter an API key to test', 'error');
      return;
    }

    this.showStatus('🧪 Testing API key...', 'loading');

    try {
      const isValid = await this.validateApiKey(apiKey);
      
      if (isValid) {
        this.showStatus('✅ API key is valid!', 'success');
      } else {
        this.showStatus('❌ API key is invalid', 'error');
      }
    } catch (error) {
      console.error('❌ API key test failed:', error);
      this.showStatus('❌ Failed to test API key', 'error');
    }
  }

  async validateApiKey(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello'
            }]
          }]
        })
      });

      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      console.error('❌ API validation error:', error);
      return false;
    }
  }

  showStatus(message, type = 'info') {
    if (!this.statusDiv) return;
    
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    
    // Auto-clear status after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => this.clearStatus(), 5000);
    }
  }

  clearStatus() {
    if (this.statusDiv) {
      this.statusDiv.textContent = '';
      this.statusDiv.className = 'status';
    }
  }
}

// Initialize popup when script loads
const popup = new QuizSolverPopup();
popup.init(); 