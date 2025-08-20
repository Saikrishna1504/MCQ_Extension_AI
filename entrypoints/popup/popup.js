// MCQ Answer Finder Popup with API Key Management
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Popup script loaded!');
  
  const statusCard = document.getElementById('statusCard');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const apiSetup = document.getElementById('apiSetup');
  const usageSteps = document.getElementById('usageSteps');
  const apiInfo = document.getElementById('apiInfo');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const testBtn = document.getElementById('testBtn');
  const saveBtn = document.getElementById('saveBtn');
  const helpLink = document.getElementById('helpLink');
  const apiKeyDisplay = document.getElementById('apiKeyDisplay');

  let currentApiKey = null;

  console.log('🎯 DOM elements found, starting initialization...');

  // Initialize the extension
  initializeExtension();

  // Button event listeners
  testBtn.addEventListener('click', testApiKey);
  saveBtn.addEventListener('click', saveApiKey);
  helpLink.addEventListener('click', openApiKeyHelp);

  async function initializeExtension() {
    try {
      console.log('🔧 Starting initialization...');
      updateStatus('⏳', 'Loading...', 'Checking for saved API key');
      
      // Check if API key is already saved
      console.log('🔍 Checking for saved API key...');
      const saved = await getSavedApiKey();
      console.log('💾 Saved data:', saved);
      
      if (saved && saved.geminiApiKey) {
        console.log('✅ Found saved API key');
        currentApiKey = saved.geminiApiKey;
        updateStatus('🔍', 'Testing saved key...', 'Verifying API connection');
        
        const isValid = await testApiConnection(currentApiKey);
        console.log('🧪 API test result:', isValid);
        
        if (isValid) {
          showSuccess();
        } else {
          showApiSetup('Saved API key is invalid');
        }
      } else {
        console.log('❌ No saved API key found');
        showApiSetup('No API key found');
      }
    } catch (error) {
      console.error('❌ Initialization error:', error);
      showApiSetup('Setup failed: ' + error.message);
    }
  }

  async function getSavedApiKey() {
    console.log('📦 Getting saved API key from storage...');
    try {
      const result = await chrome.storage.sync.get(['geminiApiKey']);
      console.log('📦 Storage result:', result);
      return result;
    } catch (error) {
      console.error('❌ Storage error:', error);
      return {};
    }
  }

  async function testApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    testBtn.disabled = true;
    saveBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    
    try {
      const isValid = await testApiConnection(apiKey);
      
      if (isValid) {
        updateStatus('✅', 'API Key Valid!', 'Connection successful');
        testBtn.textContent = '✓ Valid';
        testBtn.className = 'btn btn-primary';
        saveBtn.disabled = false;
        currentApiKey = apiKey;
      } else {
        updateStatus('❌', 'Invalid API Key', 'Please check your API key');
        testBtn.textContent = '✗ Invalid';
        testBtn.className = 'btn btn-secondary';
      }
    } catch (error) {
      console.error('API test error:', error);
      updateStatus('❌', 'Test Failed', error.message);
      testBtn.textContent = '✗ Error';
      testBtn.className = 'btn btn-secondary';
    }
    
    testBtn.disabled = false;
    saveBtn.disabled = false;
  }

  async function saveApiKey() {
    if (!currentApiKey) {
      alert('Please test the API key first');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
      await chrome.storage.sync.set({
        geminiApiKey: currentApiKey,
        setupTime: Date.now()
      });
      
      showSuccess();
    } catch (error) {
      console.error('Save error:', error);
      updateStatus('❌', 'Save Failed', error.message);
    }
    
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }

  async function testApiConnection(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, please respond with "API test successful"'
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates && data.candidates.length > 0;
      }
      return false;
    } catch (error) {
      console.error('API connection test error:', error);
      return false;
    }
  }

  function updateStatus(icon, title, desc) {
    statusIcon.textContent = icon;
    statusTitle.textContent = title;
    statusDesc.textContent = desc;
  }

  function showApiSetup(message) {
    statusCard.className = 'status-card error';
    updateStatus('🔑', 'API Key Required', message);
    apiSetup.classList.remove('hidden');
    usageSteps.classList.add('hidden');
    apiInfo.classList.add('hidden');
  }

  function showSuccess() {
    statusCard.className = 'status-card success';
    updateStatus('✅', 'Ready to Go!', 'MCQ Answer Finder is ready to use');
    
    // Hide setup, show usage
    apiSetup.classList.add('hidden');
    usageSteps.classList.remove('hidden');
    apiInfo.classList.remove('hidden');
    
    // Show masked API key
    if (currentApiKey) {
      const maskedKey = currentApiKey.substring(0, 8) + '...' + currentApiKey.slice(-4);
      apiKeyDisplay.textContent = `API Key: ${maskedKey} ✓`;
    }
  }

  function openApiKeyHelp() {
    chrome.tabs.create({
      url: 'https://makersuite.google.com/app/apikey'
    });
  }
}); 