import { defineContentScript } from 'wxt/sandbox';
import browser from 'webextension-polyfill';

export default defineContentScript({
  matches: ['<all_urls>'],
  css: ['./style.css'],
  runAt: 'document_end',

  main() {
    // MCQ Answer Finder - Smart Quiz Solver
    class SmartQuizSolver {
      constructor() {
        this.magnifyingIcon = null;
        this.promptDialog = null;
        this.lastSelection = null;
        this.init();
      }

      // Check if extension context is still valid
      isExtensionValid() {
        try {
          // Multiple checks for extension validity
          if (typeof browser === 'undefined') return false;
          if (!browser.runtime) return false;
          if (!browser.runtime.id) return false;
          
          // Try to access runtime properties
          browser.runtime.id;
          return true;
        } catch (error) {
          return false;
        }
      }

      // Show extension invalid message
      showExtensionInvalidMessage() {
        const existingMsg = document.querySelector('.extension-invalid-notice');
        if (existingMsg) return;

        const notice = document.createElement('div');
        notice.className = 'extension-invalid-notice';
        notice.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10003;
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 300px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notice.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 4px;">🔄 Extension Reloaded</div>
          <div>Please refresh this page to use the Quiz Solver.</div>
          <button onclick="location.reload()" style="
            margin-top: 8px;
            padding: 4px 8px;
            background: #721c24;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">Refresh Page</button>
        `;
        
        document.body.appendChild(notice);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (notice.parentNode) {
            notice.remove();
          }
        }, 10000);
      }

      // Safe wrapper for browser runtime calls
      async safeBrowserCall(callbackFn) {
        try {
          if (!this.isExtensionValid()) {
            throw new Error('Extension context not available');
          }
          return await callbackFn();
        } catch (error) {
          if (error.message.includes('Extension context') ||
              error.message.includes('runtime') ||
              error.message.includes('invalidated') ||
              error.message.includes('message port closed')) {
            this.showExtensionInvalidMessage();
            throw new Error('Extension was reloaded. Please refresh the page.');
          }
          throw error;
        }
      }

      init() {
        // Add global error handler for extension context issues
        window.addEventListener('error', (event) => {
          if (event.error && 
              (event.error.message.includes('Extension context invalidated') ||
               event.error.message.includes('message port closed') ||
               event.error.message.includes('runtime.lastError'))) {
            this.showExtensionInvalidMessage();
            event.preventDefault();
            return false;
          }
        });

        // Wrap initialization in try-catch
        try {
          this.createMagnifyingIcon();
          this.createPromptDialog();
          this.attachEventListeners();
          
          // Simple welcome log
          console.log('Quiz Solver Ready! Highlight text and click the 🔍 icon!');
        } catch (error) {
          console.error('Extension initialization error:', error);
          if (error.message.includes('Extension context') || 
              error.message.includes('runtime') ||
              error.message.includes('invalidated')) {
            this.showExtensionInvalidMessage();
          }
        }
      }

      createMagnifyingIcon() {
        // Create magnifying glass icon
        this.magnifyingIcon = document.createElement('div');
        this.magnifyingIcon.id = 'quiz-solver-magnify-icon';
        this.magnifyingIcon.innerHTML = '🔍';
        this.magnifyingIcon.className = 'quiz-magnify-icon';
        this.magnifyingIcon.style.display = 'none';
        this.magnifyingIcon.title = 'Click to solve with AI';
        
        // Ensure proper cursor and interaction
        this.magnifyingIcon.style.cursor = 'pointer';
        this.magnifyingIcon.style.userSelect = 'none';
        this.magnifyingIcon.style.pointerEvents = 'auto';
        this.magnifyingIcon.style.zIndex = '10001';
        
        // Prevent text selection and context menu
        this.magnifyingIcon.addEventListener('selectstart', (e) => e.preventDefault());
        this.magnifyingIcon.addEventListener('contextmenu', (e) => e.preventDefault());
        this.magnifyingIcon.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Add click handler
        this.magnifyingIcon.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Check if extension context is still valid
          if (!this.isExtensionValid()) {
            this.showExtensionInvalidMessage();
            this.hideMagnifyingIcon();
            return;
          }
          
          if (this.lastSelection && this.lastSelection.text) {
            this.showPromptDialog(this.lastSelection.text);
            this.hideMagnifyingIcon();
          }
        });

        // Add hover effects with cursor enforcement
        this.magnifyingIcon.addEventListener('mouseenter', () => {
          this.magnifyingIcon.style.cursor = 'pointer';
        });

        this.magnifyingIcon.addEventListener('mouseover', () => {
          this.magnifyingIcon.style.cursor = 'pointer';
        });

        document.body.appendChild(this.magnifyingIcon);
      }

      createPromptDialog() {
        // Create simplified prompt dialog
        this.promptDialog = document.createElement('div');
        this.promptDialog.id = 'quiz-prompt-dialog';
        this.promptDialog.innerHTML = 
          '<div class="prompt-dialog-header">' +
            '<button class="prompt-close-btn" id="prompt-close-btn">×</button>' +
          '</div>' +
          '<div class="prompt-answer-content" id="prompt-answer-content">' +
            'Loading...' +
          '</div>';

        document.body.appendChild(this.promptDialog);

        // Add event listener for close button
        this.promptDialog.querySelector('#prompt-close-btn').addEventListener('click', () => {
          this.hidePromptDialog();
        });
      }

      showPromptDialog(questionText) {
        // Position dialog in center of screen
        this.promptDialog.style.display = 'block';
        this.promptDialog.style.position = 'fixed';
        this.promptDialog.style.top = '50%';
        this.promptDialog.style.left = '50%';
        this.promptDialog.style.transform = 'translate(-50%, -50%)';
        this.promptDialog.style.zIndex = '10002';
        
        // Store question text for later use
        this.currentQuestion = questionText;
        
        // Show loading state
        const answerContent = this.promptDialog.querySelector('#prompt-answer-content');
        answerContent.innerHTML = 
          '<div class="prompt-loading">' +
            '<div class="prompt-loading-spinner"></div>' +
            'Getting answer...' +
          '</div>';
        
        // Automatically get answer
        setTimeout(() => {
          this.getAnswer();
        }, 500);
      }

      async getAnswer() {
        const answerContent = this.promptDialog.querySelector('#prompt-answer-content');
        
        try {
          // Get API key
          const response = await this.safeBrowserCall(async () => {
            return await Promise.race([
              browser.runtime.sendMessage({ action: 'getApiKey' }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 15000)
              )
            ]);
          });
          
          if (!response || !response.apiKey) {
            answerContent.innerHTML = 'Please set up your API key in the extension popup first.';
            return;
          }

          // Enhance question with context
          const enhancedQuestion = this.enhanceQuestionWithContext(this.currentQuestion);
          
          // Call Gemini API with simple prompt
          const answer = await this.callGeminiAPI(enhancedQuestion, 'Give me the answer as: Option A: [answer text]. Be concise.', response.apiKey);
          
          answerContent.innerHTML = answer;
          
        } catch (error) {
          console.error('❌ AI request error:', error);
          
          let errorMessage = 'Failed to get answer.';
          
          if (error.message.includes('Extension context invalidated') || 
              error.message.includes('message port closed') ||
              error.message.includes('runtime.lastError') ||
              error.message.includes('context invalidated')) {
            errorMessage = 'Extension was reloaded. Please refresh this page.';
          } else if (error.message.includes('Request timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'Invalid API key. Please check your setup.';
          } else if (error.message.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          }
          
          answerContent.innerHTML = errorMessage;
        }
      }

      hidePromptDialog() {
        if (this.promptDialog) {
          this.promptDialog.style.display = 'none';
        }
      }

      attachEventListeners() {
        // Listen for text selection
        document.addEventListener('mouseup', (e) => {
          setTimeout(() => this.handleTextSelection(e), 150);
        });

        // Listen for keyboard events
        document.addEventListener('keyup', (e) => {
          setTimeout(() => this.handleTextSelection(e), 150);
        });

        // Hide icon when clicking elsewhere
        document.addEventListener('click', (e) => {
          if (!e.target.closest('#quiz-solver-magnify-icon') && 
              !e.target.closest('#quiz-prompt-dialog')) {
            this.hideMagnifyingIcon();
          }
        });

        // Hide icon on scroll
        document.addEventListener('scroll', () => {
          this.hideMagnifyingIcon();
        });

        // Listen for messages from background script
        try {
          browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
              // Check extension validity first
              if (!this.isExtensionValid()) {
                this.showExtensionInvalidMessage();
                sendResponse({ success: false, error: 'Extension context invalid' });
                return true;
              }

              if (request.action === 'solveQuestion' && request.text) {
                this.showPromptDialog(request.text);
                sendResponse({ success: true });
              } else if (request.action === 'solveSelectedText') {
                this.handleKeyboardShortcut();
                sendResponse({ success: true });
              }
            } catch (error) {
              console.error('❌ Message listener error:', error);
              if (error.message.includes('Extension context') ||
                  error.message.includes('runtime') ||
                  error.message.includes('invalidated')) {
                this.showExtensionInvalidMessage();
              }
              sendResponse({ success: false, error: error.message });
            }
            
            return true;
          });
        } catch (error) {
          console.error('❌ Failed to setup message listener:', error);
          if (error.message.includes('Extension context') ||
              error.message.includes('runtime') ||
              error.message.includes('invalidated')) {
            this.showExtensionInvalidMessage();
          }
        }

        // Auto-detect quiz elements on page load
        this.detectQuizElements();
      }

      handleTextSelection(event) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 5 && selection.rangeCount > 0) {
          try {
          this.lastSelection = {
            text: selectedText,
            range: selection.getRangeAt(0)
          };

            // Show magnifying icon near cursor
            this.showMagnifyingIcon(event);
            
          } catch (error) {
            console.error('❌ Error handling selection:', error);
          }
        } else {
          this.hideMagnifyingIcon();
        }
      }

      showMagnifyingIcon(event) {
        if (!this.lastSelection || !this.lastSelection.range) return;

        try {
          const rect = this.lastSelection.range.getBoundingClientRect();
          
          // Position icon above the selection, slightly to the right
          const iconX = Math.min(rect.right + window.scrollX - 10, window.innerWidth - 40);
          const iconY = Math.max(rect.top + window.scrollY - 35, 10);
          
          this.magnifyingIcon.style.position = 'absolute';
          this.magnifyingIcon.style.left = `${iconX}px`;
          this.magnifyingIcon.style.top = `${iconY}px`;
          this.magnifyingIcon.style.display = 'block';
          this.magnifyingIcon.style.zIndex = '10001';
          
          // Add a subtle animation
          this.magnifyingIcon.style.transform = 'scale(0.8)';
          setTimeout(() => {
            if (this.magnifyingIcon.style.display === 'block') {
              this.magnifyingIcon.style.transform = 'scale(1)';
            }
          }, 50);
        } catch (error) {
          console.error('❌ Error positioning magnifying icon:', error);
        }
      }

      hideMagnifyingIcon() {
        if (this.magnifyingIcon) {
          this.magnifyingIcon.style.display = 'none';
        }
      }

      handleKeyboardShortcut() {
        // Check if extension context is still valid
        if (!this.isExtensionValid()) {
          this.showExtensionInvalidMessage();
          return;
        }
        
        if (this.lastSelection && this.lastSelection.text) {
          this.showPromptDialog(this.lastSelection.text);
          this.hideMagnifyingIcon();
          } else {
          // Just show console message instead of unused showMessage
          console.log('Please select some text first');
        }
      }

      enhanceQuestionWithContext(questionText) {
        // Look for surrounding context on the page
        let context = questionText;
        
        // Try to find question patterns and options
        const pageText = document.body.innerText;
        const questionIndex = pageText.indexOf(questionText);
        
        if (questionIndex !== -1) {
          // Get some context before and after
          const start = Math.max(0, questionIndex - 500);
          const end = Math.min(pageText.length, questionIndex + questionText.length + 500);
          const surroundingText = pageText.substring(start, end);
          
          // Look for option patterns in surrounding text
          const optionPatterns = [
            /[A-D]\.\s+[^\n]+/g,
            /[A-D]\)\s+[^\n]+/g,
            /\([A-D]\)\s+[^\n]+/g,
            /[1-4]\.\s+[^\n]+/g,
            /[1-4]\)\s+[^\n]+/g
          ];
          
          let options = [];
          optionPatterns.forEach(pattern => {
            const matches = surroundingText.match(pattern);
            if (matches && matches.length > 1) {
              options = options.concat(matches);
            }
          });
          
          if (options.length > 0) {
            context = `Question: ${questionText}\n\nOptions:\n${options.slice(0, 6).join('\n')}`;
          }
        }
        
        return context;
      }

      async callGeminiAPI(questionText, customPrompt, apiKey) {
        const prompt = customPrompt + "\n\nQuestion to analyze:\n" + questionText;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 300
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error(`API authentication failed (${response.status}). Please check your API key.`);
          } else if (response.status === 429) {
            throw new Error(`Rate limit exceeded (${response.status}). Please try again later.`);
          } else {
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
          }
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const answer = data.candidates[0].content.parts[0].text;
          return answer;
        } else {
          console.error('❌ Invalid API response format:', data);
          throw new Error('Invalid API response format - no valid answer found');
        }
      }

      detectQuizElements() {
        // Auto-detect common quiz platforms and add helpful hints
        const url = window.location.hostname.toLowerCase();
        const quizPlatforms = [
          'geeksforgeeks.org',
          'canvas.',
          'blackboard.',
          'moodle.',
          'coursera.',
          'edx.',
          'udemy.',
          'khan',
          'quiz',
          'test',
          'exam'
        ];

        const isQuizSite = quizPlatforms.some(platform => url.includes(platform));
        
        if (isQuizSite) {
          // Show a welcome message on quiz sites
          setTimeout(() => {
            this.showQuizSiteWelcome();
          }, 3000);
        }
      }

      showQuizSiteWelcome() {
        // Show welcome message only once per session
        if (sessionStorage.getItem('quiz-solver-welcomed')) return;
        sessionStorage.setItem('quiz-solver-welcomed', 'true');

        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'quiz-solver-welcome';
        welcomeDiv.innerHTML = 
          '<div class="welcome-content">' +
            '<div class="welcome-icon">🔍</div>' +
            '<div class="welcome-text">' +
              '<strong>Quiz Solver Active!</strong><br>' +
              'Highlight text → Click 🔍 for prompt dialog<br>' +
              'Or press <kbd>Ctrl+Shift+Q</kbd>' +
            '</div>' +
            '<div class="welcome-close">×</div>' +
          '</div>';
        
        document.body.appendChild(welcomeDiv);

        // Auto-remove after 7 seconds
        setTimeout(() => {
          if (welcomeDiv.parentNode) {
            welcomeDiv.remove();
          }
        }, 7000);

        // Manual close
        welcomeDiv.querySelector('.welcome-close').addEventListener('click', () => {
          welcomeDiv.remove();
        });
      }
    }

    // Global variable to ensure single instance
    let quizSolverInstance = null;

    // Initialize the Smart Quiz Solver
    function initializeQuizSolver() {
      if (quizSolverInstance) {
        return;
      }
      
      try {
        // Check if browser extension context is available
        if (typeof browser === 'undefined' || !browser.runtime) {
          return;
        }

        // Additional check for extension context
        try {
          browser.runtime.id; // This will throw if context is invalid
        } catch (contextError) {
          return;
        }

        quizSolverInstance = new SmartQuizSolver();
      } catch (error) {
        console.error('❌ Failed to initialize Quiz Solver:', error);
        if (error.message.includes('Extension context') ||
            error.message.includes('runtime') ||
            error.message.includes('invalidated')) {
          // Context issue detected during initialization
        }
      }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeQuizSolver);
    } else {
      initializeQuizSolver();
    }

    // Also listen for navigation changes in SPAs
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(initializeQuizSolver, 500);
      });
    }
  }
}); 