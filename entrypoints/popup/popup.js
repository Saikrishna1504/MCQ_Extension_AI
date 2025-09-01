import browser from 'webextension-polyfill';

class PopupManager {
  constructor() {
    this.apiKeyInput = null;
    this.saveButton = null;
    this.statusDiv = null;
    this.testButton = null;
    this.isInitialized = false;
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
    this.setupCreatorLink();
  }

  setupCreatorLink() {
    const creatorLink = document.getElementById('creator-link');
    if (creatorLink) {
      creatorLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await browser.tabs.create({ url: 'https://github.com/saikrishna1504' });
      });
    }
  }

  setupUI() {
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveButton = document.getElementById('saveBtn');
    this.statusDiv = document.getElementById('statusDesc');
    this.testButton = document.getElementById('testBtn');
    this.statusCard = document.getElementById('statusCard');
    this.statusIcon = document.getElementById('statusIcon');
    this.statusTitle = document.getElementById('statusTitle');
    this.apiSetup = document.getElementById('apiSetup');

    if (!this.apiKeyInput || !this.saveButton || !this.statusDiv) {
      console.error('❌ Required DOM elements not found');
      return;
    }

    this.saveButton.addEventListener('click', () => this.saveApiKey());
    this.testButton?.addEventListener('click', () => this.testApiKey());
    this.apiKeyInput.addEventListener('input', () => this.clearStatus());

    this.loadSavedApiKey();
    this.isInitialized = true;
  }

  async loadSavedApiKey() {
    try {
      const data = await browser.storage.sync.get(['geminiApiKey']);
      if (data.geminiApiKey) {
        this.apiKeyInput.value = data.geminiApiKey;
        if (await this.validateApiKey(data.geminiApiKey)) {
          this.showConnectedState();
        } else {
          this.showSetupState('⚠️ Please verify your API key');
        }
      } else {
        this.showSetupState('Please enter your Gemini API key to get started');
      }
    } catch (error) {
      console.error('❌ Failed to load saved API key:', error);
      this.showSetupState('Error loading settings');
    }
  }

  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('❌ Please enter your API key', 'error');
      return;
    }

    this.showStatus('🔄 Checking API key...', 'loading');

    try {
      const isValid = await this.validateApiKey(apiKey);
      
      if (!isValid) {
        this.showStatus('❌ API key validation failed. Please check the key and try again.', 'error');
        return;
      }

      await browser.storage.sync.set({ geminiApiKey: apiKey });
      this.showStatus('✅ API key verified and saved!', 'success');
      
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      console.error('❌ API key validation error:', error);
      this.showStatus('❌ Connection error. Please check your internet connection.', 'error');
    }
  }

  async testApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('❌ Please enter an API key to test', 'error');
      return;
    }

    this.showStatus('🔄 Testing connection...', 'loading');

    try {
      const isValid = await this.validateApiKey(apiKey);
      if (isValid) {
        this.showStatus('✅ Connection successful!', 'success');
      } else {
        this.showStatus('❌ Connection failed. Please check your API key.', 'error');
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      this.showStatus('❌ Connection error. Please check your internet connection.', 'error');
    }
  }

  async validateApiKey(apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      
      const response = await fetch(url);
      console.log('API Response:', response.status, response.statusText);
      
      return response.status === 200;
    } catch (error) {
      console.error('API validation error:', error);
      return false;
    }
  }

  showConnectedState() {
    this.statusIcon.textContent = '✅';
    this.statusTitle.textContent = 'Ready to Use!';
    this.statusDiv.textContent = 'Your API key is set up and working.';
    this.statusCard.className = 'status-card success';
    this.apiSetup.classList.add('hidden');
  }

  showSetupState(message = 'Please enter your API key') {
    this.statusIcon.textContent = '🔑';
    this.statusTitle.textContent = 'Setup Required';
    this.statusDiv.textContent = message;
    this.statusCard.className = 'status-card';
    this.apiSetup.classList.remove('hidden');
  }

  showStatus(message, type = 'info') {
    if (!this.statusDiv) return;

    this.statusDiv.textContent = message;
    
    switch (type) {
      case 'loading':
        this.statusIcon.textContent = '⏳';
        this.statusCard.className = 'status-card loading';
        break;
      case 'success':
        this.statusIcon.textContent = '✅';
        this.statusCard.className = 'status-card success';
        break;
      case 'error':
        this.statusIcon.textContent = '❌';
        this.statusCard.className = 'status-card error';
        break;
      default:
        this.statusIcon.textContent = 'ℹ️';
        this.statusCard.className = 'status-card';
    }
  }

  clearStatus() {
    this.loadSavedApiKey();
  }
}

const popup = new PopupManager();
popup.init();
