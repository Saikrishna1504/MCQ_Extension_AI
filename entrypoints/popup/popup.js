import browser from 'webextension-polyfill';
import { CONFIG } from '../shared/config.js';

class PopupManager {
  constructor() {
    this.apiKeyInput = null;
    this.providerSelect = null;
    this.apiKeyLabel = null;
    this.saveButton = null;
    this.statusDiv = null;
    this.testButton = null;
    this.statusCard = null;
    this.statusIcon = null;
    this.statusTitle = null;
    this.apiSetup = null;
    this.apiManagement = null;
    this.changeApiBtn = null;
    this.removeApiBtn = null;
    this.isInitialized = false;
    this.isLoading = false;
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
    this.setupCreatorLink();
    this.setupHelpLink();
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

  setupHelpLink() {
    const helpLink = document.getElementById('helpLink');
    const helpModal = document.getElementById('helpModal');
    const helpModalClose = document.getElementById('helpModalClose');
    const helpContent = document.getElementById('helpContent');

    if (helpLink && helpModal && helpContent) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHelpModal();
      });

      if (helpModalClose) {
        helpModalClose.addEventListener('click', () => {
          this.hideHelpModal();
        });
      }

      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          this.hideHelpModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal.classList.contains('active')) {
          this.hideHelpModal();
        }
      });
    }
  }

  showHelpModal() {
    const helpModal = document.getElementById('helpModal');
    const helpContent = document.getElementById('helpContent');
    const provider = this.providerSelect?.value || CONFIG.PROVIDERS.GEMINI;

    if (!helpModal || !helpContent) return;

    if (provider === CONFIG.PROVIDERS.CHATGPT) {
      helpContent.innerHTML = `
        <div class="help-steps">
          <h4>🤖 OpenAI ChatGPT API Key</h4>
          <ol>
            <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></li>
            <li>Sign in or create a free account</li>
            <li>Click <strong>"Create new secret key"</strong></li>
            <li>Copy the API key (starts with <code>sk-</code>)</li>
            <li>Paste it in the input field above</li>
            <li>Click <strong>"Test"</strong> to verify, then <strong>"Save"</strong></li>
          </ol>
          <div style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 11px;">
            <strong>💡 Note:</strong> Free tier includes $5 credit. API keys are free to create.<br>
            <strong>⚠️ Rate Limits:</strong> New keys may have rate limits. Wait 1-2 minutes after creating the key before testing.
          </div>
        </div>
        <div class="help-direct-link">
          <button class="btn btn-primary" id="openChatGPTLink">Open OpenAI Platform →</button>
        </div>
      `;
    } else {
      helpContent.innerHTML = `
        <div class="help-steps">
          <h4>🤖 Google Gemini API Key</h4>
          <ol>
            <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
            <li>Sign in with your Google account</li>
            <li>Click <strong>"Create API Key"</strong></li>
            <li>Select or create a Google Cloud project</li>
            <li>Copy the API key (starts with <code>AIza</code>)</li>
            <li>Paste it in the input field above</li>
            <li>Click <strong>"Test"</strong> to verify, then <strong>"Save"</strong></li>
          </ol>
          <div style="margin-top: 12px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 11px;">
            <strong>💡 Note:</strong> Free tier includes 60 requests per minute. No credit card required for basic usage.
          </div>
        </div>
        <div class="help-direct-link">
          <button class="btn btn-primary" id="openGeminiLink">Open Google AI Studio →</button>
        </div>
      `;
    }

    helpModal.classList.add('active');

    const directLinkBtn = document.getElementById(provider === CONFIG.PROVIDERS.CHATGPT ? 'openChatGPTLink' : 'openGeminiLink');
    if (directLinkBtn) {
      directLinkBtn.addEventListener('click', async () => {
        const url = provider === CONFIG.PROVIDERS.CHATGPT
          ? 'https://platform.openai.com/api-keys'
          : 'https://makersuite.google.com/app/apikey';
        await browser.tabs.create({ url });
      });
    }
  }

  hideHelpModal() {
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
      helpModal.classList.remove('active');
    }
  }

  setupUI() {
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.providerSelect = document.getElementById('providerSelect');
    this.apiKeyLabel = document.getElementById('apiKeyLabel');
    this.saveButton = document.getElementById('saveBtn');
    this.statusDiv = document.getElementById('statusDesc');
    this.testButton = document.getElementById('testBtn');
    this.statusCard = document.getElementById('statusCard');
    this.statusIcon = document.getElementById('statusIcon');
    this.statusTitle = document.getElementById('statusTitle');
    this.apiSetup = document.getElementById('apiSetup');
    this.apiManagement = document.getElementById('apiManagement');
    this.changeApiBtn = document.getElementById('changeApiBtn');
    this.removeApiBtn = document.getElementById('removeApiBtn');

    if (!this.apiKeyInput || !this.saveButton || !this.statusDiv || !this.providerSelect) {
      console.error('❌ Required DOM elements not found');
      return;
    }

    this.enableInput();

    this.providerSelect.addEventListener('change', () => this.updateProviderUI());
    this.saveButton.addEventListener('click', () => this.saveApiKey());
    this.testButton?.addEventListener('click', () => this.testApiKey());
    this.changeApiBtn?.addEventListener('click', () => this.showChangeApiKey());
    this.removeApiBtn?.addEventListener('click', () => this.removeApiKey());
    
    const skipValidationLink = document.getElementById('skipValidationLink');
    if (skipValidationLink) {
      skipValidationLink.addEventListener('click', () => this.saveApiKeyWithoutValidation());
    }
    
    this.apiKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.isLoading) {
        e.preventDefault();
        this.saveApiKey();
      }
    });

    this.loadSavedApiKey();
    this.isInitialized = true;
  }

  updateProviderUI() {
    const provider = this.providerSelect.value;
    if (this.apiKeyLabel) {
      if (provider === CONFIG.PROVIDERS.CHATGPT) {
        this.apiKeyLabel.textContent = 'OpenAI API Key:';
        this.apiKeyInput.placeholder = 'sk-...';
      } else {
        this.apiKeyLabel.textContent = 'Google Gemini API Key:';
        this.apiKeyInput.placeholder = 'AIzaSyA...';
      }
    }
    
    const helpModal = document.getElementById('helpModal');
    if (helpModal && helpModal.classList.contains('active')) {
      this.showHelpModal();
    }
  }

  enableInput() {
    if (!this.apiKeyInput) return;
    
    this.apiKeyInput.disabled = false;
    this.apiKeyInput.readOnly = false;
    this.apiKeyInput.removeAttribute('disabled');
    this.apiKeyInput.removeAttribute('readonly');
    this.apiKeyInput.removeAttribute('aria-disabled');
    
    this.apiKeyInput.style.pointerEvents = 'auto';
    this.apiKeyInput.style.cursor = 'text';
    this.apiKeyInput.style.opacity = '1';
    this.apiKeyInput.style.zIndex = '10';
  }

  async loadSavedApiKey() {
    try {
      const data = await browser.storage.sync.get([CONFIG.STORAGE.API_KEY, CONFIG.STORAGE.PROVIDER]);
      const provider = data[CONFIG.STORAGE.PROVIDER] || CONFIG.PROVIDERS.GEMINI;
      
      if (this.providerSelect) {
        this.providerSelect.value = provider;
        this.updateProviderUI();
      }
      
      if (data[CONFIG.STORAGE.API_KEY]) {
        if (await this.validateApiKey(data[CONFIG.STORAGE.API_KEY], provider)) {
          this.apiKeyInput.value = '';
          this.showConnectedState();
        } else {
          this.apiKeyInput.value = data[CONFIG.STORAGE.API_KEY];
          this.showSetupState('⚠️ Please verify your API key');
          this.enableInput();
        }
      } else {
        this.apiKeyInput.value = '';
        this.showSetupState('Please enter your API key to get started');
        this.enableInput();
      }
    } catch (error) {
      console.error('❌ Failed to load saved API key:', error);
      this.showSetupState('Error loading settings');
      this.enableInput();
    }
  }

  async saveApiKey(skipValidation = false) {
    if (this.isLoading) return;
    
    const apiKey = this.apiKeyInput.value.trim();
    const provider = this.providerSelect.value;
    
    if (!apiKey) {
      this.showStatus('❌ Please enter your API key', 'error');
      return;
    }

    if (provider === CONFIG.PROVIDERS.CHATGPT && !apiKey.startsWith('sk-')) {
      this.showStatus('❌ Invalid ChatGPT API key format. Should start with "sk-"', 'error');
      return;
    }

    if (provider === CONFIG.PROVIDERS.GEMINI && !apiKey.startsWith('AIza')) {
      this.showStatus('❌ Invalid Gemini API key format. Should start with "AIza"', 'error');
      return;
    }

    this.isLoading = true;
    this.showStatus(skipValidation ? '💾 Saving API key...' : '🔄 Checking API key...', 'loading');
    this.saveButton.disabled = true;
    this.testButton.disabled = true;
    this.enableInput();

    try {
      if (!skipValidation) {
        const isValid = await this.validateApiKey(apiKey, provider);
        
        if (!isValid) {
          const errorMsg = provider === CONFIG.PROVIDERS.CHATGPT
            ? '❌ Validation failed. If you just created the key, try "Skip validation & save directly" below, or wait 1-2 minutes and test again.'
            : '❌ API key validation failed. Please check the key and try again.';
          this.showStatus(errorMsg, 'error');
          this.saveButton.disabled = false;
          this.testButton.disabled = false;
          this.isLoading = false;
          this.enableInput();
          return;
        }
      }

      await browser.storage.sync.set({ 
        [CONFIG.STORAGE.API_KEY]: apiKey,
        [CONFIG.STORAGE.PROVIDER]: provider
      });
      this.showStatus(skipValidation ? '✅ API key saved! (Validation skipped)' : '✅ API key verified and saved!', 'success');
      
      setTimeout(() => {
        this.showConnectedState();
        this.isLoading = false;
      }, 500);
      
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      console.error('❌ API key validation error:', error);
      this.showStatus('❌ Connection error. Please check your internet connection.', 'error');
      this.saveButton.disabled = false;
      this.testButton.disabled = false;
      this.isLoading = false;
      this.enableInput();
    }
  }

  async saveApiKeyWithoutValidation() {
    await this.saveApiKey(true);
  }

  async testApiKey() {
    if (this.isLoading) return;
    
    const apiKey = this.apiKeyInput.value.trim();
    const provider = this.providerSelect.value;
    
    if (!apiKey) {
      this.showStatus('❌ Please enter an API key to test', 'error');
      return;
    }

    this.isLoading = true;
    this.showStatus('🔄 Testing connection...', 'loading');
    this.testButton.disabled = true;
    this.saveButton.disabled = true;
    this.enableInput();

    try {
      const isValid = await this.validateApiKey(apiKey, provider);
      if (isValid) {
        this.showStatus('✅ Connection successful!', 'success');
      } else {
        const provider = this.providerSelect.value;
        const errorMsg = provider === CONFIG.PROVIDERS.CHATGPT
          ? '❌ Connection failed. If you just created the key, wait a minute. Also check: 1) Key starts with "sk-", 2) You have credits in OpenAI account, 3) Try again in a moment.'
          : '❌ Connection failed. Please check your API key.';
        this.showStatus(errorMsg, 'error');
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      this.showStatus('❌ Connection error. Please check your internet connection.', 'error');
    } finally {
      this.testButton.disabled = false;
      this.saveButton.disabled = false;
      this.isLoading = false;
      this.enableInput();
    }
  }

  async validateApiKey(apiKey, provider) {
    try {
      if (provider === CONFIG.PROVIDERS.CHATGPT) {
        if (!apiKey.startsWith('sk-')) {
          return false;
        }
        
        try {
          const url = `${CONFIG.API.CHATGPT.BASE_URL}/v1/chat/completions`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: CONFIG.API.CHATGPT.MODEL,
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 5,
            }),
            signal: AbortSignal.timeout(10000),
          });
          
          if (response.status === 401 || response.status === 403) {
            return false;
          }
          
          if (response.status === 429) {
            return true;
          }
          
          if (response.status === 402) {
            return false;
          }
          
          return response.ok;
        } catch (error) {
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            return true;
          }
          return false;
        }
      } else {
        const url = `${CONFIG.API.GEMINI.BASE_URL}/v1/models?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(CONFIG.API.TIMEOUT),
        });
        return response.status === 200;
      }
    } catch (error) {
      console.error('API validation error:', error);
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return true;
      }
      return false;
    }
  }

  showConnectedState() {
    if (!this.statusIcon || !this.statusTitle || !this.statusDiv || !this.statusCard || !this.apiSetup) {
      return;
    }
    
    const provider = this.providerSelect?.value || CONFIG.PROVIDERS.GEMINI;
    const providerName = provider === CONFIG.PROVIDERS.CHATGPT ? 'ChatGPT' : 'Gemini';
    
    this.statusIcon.textContent = '✅';
    this.statusTitle.textContent = 'Ready to Use!';
    this.statusDiv.textContent = `Your ${providerName} API key is set up and working.`;
    this.statusCard.className = 'status-card success';
    this.apiSetup.classList.add('hidden');
    
    if (this.apiManagement) {
      this.apiManagement.classList.remove('hidden');
    }
  }

  showSetupState(message = 'Please enter your API key') {
    if (!this.statusIcon || !this.statusTitle || !this.statusDiv || !this.statusCard || !this.apiSetup) {
      return;
    }
    
    this.statusIcon.textContent = '🔑';
    this.statusTitle.textContent = 'Setup Required';
    this.statusDiv.textContent = message;
    this.statusCard.className = 'status-card';
    this.apiSetup.classList.remove('hidden');
    
    setTimeout(() => {
      this.enableInput();
      if (this.apiKeyInput && document.activeElement !== this.apiKeyInput) {
        this.apiKeyInput.focus();
      }
    }, 50);
    
    if (this.apiManagement) {
      this.apiManagement.classList.add('hidden');
    }
  }

  showChangeApiKey() {
    this.showSetupState('Enter a new API key to replace the current one');
    
    if (this.apiKeyInput) {
      this.apiKeyInput.value = '';
      this.enableInput();
      setTimeout(() => {
        this.apiKeyInput.focus();
        this.apiKeyInput.select();
      }, 150);
    }
    
    if (this.apiManagement) {
      this.apiManagement.classList.add('hidden');
    }
  }

  async removeApiKey() {
    const confirmed = confirm('Are you sure you want to remove your API key? You will need to enter it again to use the extension.');
    
    if (!confirmed) {
      return;
    }

    try {
      await browser.storage.sync.remove([CONFIG.STORAGE.API_KEY, CONFIG.STORAGE.PROVIDER]);
      
      if (this.apiKeyInput) {
        this.apiKeyInput.value = '';
        this.enableInput();
      }
      
      if (this.providerSelect) {
        this.providerSelect.value = CONFIG.PROVIDERS.GEMINI;
        this.updateProviderUI();
      }
      
      this.showStatus('✅ API key removed successfully', 'success');
      
      setTimeout(() => {
        this.showSetupState('API key removed. Please enter a new API key to continue.');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to remove API key:', error);
      this.showStatus('❌ Failed to remove API key. Please try again.', 'error');
    }
  }

  showStatus(message, type = 'info') {
    if (!this.statusDiv || !this.statusIcon || !this.statusCard) return;

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
}

const popup = new PopupManager();
popup.init();
