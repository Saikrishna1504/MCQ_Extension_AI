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
        this.answerBubble = null;
        this.magnifyingIcon = null;
        this.lastSelection = null;
        this.isProcessing = false;
        this.init();
      }

      init() {
        this.createAnswerBubble();
        this.createMagnifyingIcon();
        this.attachEventListeners();
        console.log('🔍 Smart Quiz Solver v2.0 loaded successfully!');
        
        // Welcome message
        setTimeout(() => {
          this.showMessage('🎉 Quiz Solver Ready! Highlight text and click the 🔍 icon!', 'success');
          setTimeout(() => this.hideAnswerBubble(), 3000);
        }, 1000);
      }

      createAnswerBubble() {
        // Create floating answer bubble
        this.answerBubble = document.createElement('div');
        this.answerBubble.id = 'quiz-solver-bubble';
        this.answerBubble.style.display = 'none';
        document.body.appendChild(this.answerBubble);
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
          
          if (this.lastSelection && this.lastSelection.text) {
            this.solveQuestion(this.lastSelection.text);
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
              !e.target.closest('#quiz-solver-bubble')) {
            this.hideMagnifyingIcon();
          }
        });

        // Hide icon on scroll
        document.addEventListener('scroll', () => {
          this.hideMagnifyingIcon();
        });

        // Listen for messages from background script
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (request.action === 'solveQuestion' && request.text) {
            this.solveQuestion(request.text);
            sendResponse({ success: true });
          } else if (request.action === 'solveSelectedText') {
            this.handleKeyboardShortcut();
            sendResponse({ success: true });
          }
          
          return true;
        });

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
            
            // Also show selection indicator
            this.showSelectionIndicator();
          } catch (error) {
            console.error('❌ Error handling selection:', error);
          }
        } else {
          this.hideMagnifyingIcon();
          this.hideAnswerBubble();
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
        if (this.lastSelection && this.lastSelection.text) {
          this.solveQuestion(this.lastSelection.text);
          this.hideMagnifyingIcon();
        } else {
          this.showMessage('❌ Please select some text first', 'error');
        }
      }

      showSelectionIndicator() {
        // Show a small, unobtrusive indicator near selection
        if (this.lastSelection && this.lastSelection.range) {
          const rect = this.lastSelection.range.getBoundingClientRect();
          
          this.answerBubble.innerHTML = 
            '<div class="quiz-bubble-indicator">' +
              '<div class="quiz-bubble-tip">🔍 Click the magnifying glass or right-click "Solve with AI"</div>' +
            '</div>';
          
          this.answerBubble.className = 'quiz-bubble quiz-bubble-indicator-mode';
          this.answerBubble.style.display = 'block';
          this.answerBubble.style.left = `${rect.left + window.scrollX}px`;
          this.answerBubble.style.top = `${rect.bottom + window.scrollY + 5}px`;

          // Auto-hide indicator after 5 seconds
          setTimeout(() => {
            if (this.answerBubble.className.includes('indicator-mode')) {
              this.hideAnswerBubble();
            }
          }, 5000);
        }
      }

      async solveQuestion(questionText) {
        if (this.isProcessing) {
          console.log('⏳ Already processing, please wait...');
          return;
        }
        
        this.isProcessing = true;
        this.hideMagnifyingIcon();
        console.log('🤖 Starting to solve question:', questionText);

        try {
          // Enhance question with context
          const enhancedQuestion = this.enhanceQuestionWithContext(questionText);
          
          this.showMessage('🤖 AI is analyzing your question...', 'loading');

          // Get API key
          const response = await browser.runtime.sendMessage({ action: 'getApiKey' });
          
          if (!response || !response.apiKey) {
            this.showMessage('⚠️ Please set up your API key in the extension popup', 'error');
            return;
          }

          // Call Gemini API
          const answer = await this.callGeminiAPI(enhancedQuestion, response.apiKey);
          console.log('✅ Got answer from AI');
          this.showMessage(`✅ ${answer}`, 'success');

        } catch (error) {
          console.error('❌ Quiz solver error:', error);
          
          if (error.message.includes('401') || error.message.includes('403')) {
            this.showMessage('🔐 Invalid API key. Please check your setup.', 'error');
          } else if (error.message.includes('429')) {
            this.showMessage('⏰ Rate limit exceeded. Please try again later.', 'error');
          } else {
            this.showMessage('❌ Failed to get answer. Please try again.', 'error');
          }
        } finally {
          this.isProcessing = false;
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

      async callGeminiAPI(questionText, apiKey) {
        const prompt = "You are a smart quiz solver. Analyze this question and provide the correct answer.\n\n" +
          questionText + 
          "\n\nInstructions:\n" +
          "- If it's a multiple choice question, provide the correct option letter (A, B, C, D) followed by a brief explanation\n" +
          "- If it's a direct question, provide a clear, concise answer\n" +
          "- Be accurate and confident in your response\n" +
          "- Keep the answer brief but informative\n\n" +
          "Answer:";

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
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          return data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Invalid API response format');
        }
      }

      showMessage(message, type = 'info') {
        this.answerBubble.innerHTML = 
          '<div class="quiz-bubble-content">' +
            '<div class="quiz-bubble-close">×</div>' +
            '<div class="quiz-bubble-message">' + message + '</div>' +
          '</div>';

        this.answerBubble.className = `quiz-bubble quiz-bubble-${type}`;
        this.answerBubble.style.display = 'block';

        // Position near last selection or center of screen
        if (this.lastSelection && this.lastSelection.range) {
          const rect = this.lastSelection.range.getBoundingClientRect();
          this.answerBubble.style.left = `${rect.left + window.scrollX}px`;
          this.answerBubble.style.top = `${rect.bottom + window.scrollY + 10}px`;
        } else {
          // Center on screen if no selection
          this.answerBubble.style.left = '50%';
          this.answerBubble.style.top = '20%';
          this.answerBubble.style.transform = 'translateX(-50%)';
        }

        // Add close functionality
        const closeBtn = this.answerBubble.querySelector('.quiz-bubble-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.hideAnswerBubble());
        }

        // Auto-close success messages after 15 seconds
        if (type === 'success') {
          setTimeout(() => {
            if (this.answerBubble.style.display === 'block') {
              this.hideAnswerBubble();
            }
          }, 15000);
        }
      }

      hideAnswerBubble() {
        if (this.answerBubble) {
          this.answerBubble.style.display = 'none';
          this.answerBubble.style.transform = '';
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
              'Highlight text → Click 🔍 or Right-click → "Solve with AI"<br>' +
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
        console.log('🔍 Quiz Solver already initialized');
        return;
      }
      
      try {
        quizSolverInstance = new SmartQuizSolver();
        console.log('🎉 Quiz Solver initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Quiz Solver:', error);
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