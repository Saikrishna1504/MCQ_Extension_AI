import { defineContentScript } from 'wxt/utils/define-content-script';
import browser from 'webextension-polyfill';
import { CONFIG } from '../shared/config.js';
import { 
  isExtensionValid, 
  safeBrowserCall, 
  getApiKey,
  getProvider,
  getFullPageSelection,
  formatAnswer,
  findNearbyImages,
  enhanceQuestionWithContext,
  debounce,
  isExtensionContextError,
} from '../shared/utils.js';
import { callAIAPI } from '../shared/api.js';
import { ExtensionNotice, MagnifyingIcon, PromptDialog } from '../shared/ui.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  css: ['./style.css'],
  runAt: 'document_end',

  main() {
    class SmartQuizSolver {
      constructor() {
        this.magnifyingIcon = null;
        this.promptDialog = null;
        this.extensionNotice = null;
        this.lastSelection = null;
        this.isInitialized = false;
        this.init();
      }

      init() {
        window.addEventListener('error', (event) => {
          if (event.error && isExtensionContextError(event.error)) {
            this.showExtensionInvalidMessage();
            event.preventDefault();
            return false;
          }
        });

        try {
          this.extensionNotice = new ExtensionNotice();
          this.magnifyingIcon = new MagnifyingIcon(() => this.handleIconClick());
          this.promptDialog = new PromptDialog();
          this.attachEventListeners();
          
          console.log('✅ Quiz Solver Ready! Highlight text and click the 🔍 icon!');
          this.isInitialized = true;
        } catch (error) {
          console.error('❌ Extension initialization error:', error);
          if (isExtensionContextError(error)) {
            this.showExtensionInvalidMessage();
          }
        }
      }

      showExtensionInvalidMessage() {
        if (this.extensionNotice) {
          this.extensionNotice.show();
        }
      }

      async handleIconClick() {
        if (!isExtensionValid()) {
          this.showExtensionInvalidMessage();
          this.magnifyingIcon.hide();
          return;
        }
        
        const fullPageMode = await getFullPageSelection();
        let textToUse = '';
        let imagesToUse = [];
        
        if (fullPageMode) {
          const fullPageText = document.body.innerText || document.body.textContent || '';
          if (fullPageText.trim()) {
            textToUse = fullPageText.trim();
            const range = document.createRange();
            range.selectNodeContents(document.body);
            imagesToUse = findNearbyImages(range);
          }
        } else if (this.lastSelection && this.lastSelection.text) {
          textToUse = this.lastSelection.text;
          imagesToUse = this.lastSelection.images || [];
        }
        
        if (textToUse) {
          this.promptDialog.show(textToUse, imagesToUse);
          this.magnifyingIcon.hide();
          
          setTimeout(() => {
            this.getAnswer();
          }, CONFIG.UI.DIALOG_AUTO_SEND_DELAY);
        }
      }

      async getAnswer() {
        if (!this.promptDialog || !this.promptDialog.dialog) return;
        const answerContent = this.promptDialog.dialog.querySelector('#prompt-answer-content');
        
        try {
          const apiKey = await getApiKey();
          const provider = await getProvider();
          const fullPageMode = await getFullPageSelection();
          
          if (!apiKey) {
            this.promptDialog.showError(CONFIG.ERRORS.API_KEY_MISSING);
            return;
          }

          const questionText = this.promptDialog.getCurrentQuestion();
          const images = this.promptDialog.getCurrentImages();
          
          let enhancedQuestion = fullPageMode ? questionText : enhanceQuestionWithContext(questionText, document);
          
          let prompt = CONFIG.PROMPTS.DEFAULT;
          let isCodingMode = false;
          
          if (fullPageMode) {
            prompt = CONFIG.PROMPTS.CODING;
            isCodingMode = true;
          } else if (images && (images.questionImage || (images.optionImages && images.optionImages.length > 0))) {
            prompt = CONFIG.PROMPTS.IMAGE_BASED;
            if (images.questionImage || images.optionImages?.length > 0) {
              enhancedQuestion = 'Image-based question:\n';
              
              if (images.questionImage) {
                enhancedQuestion += `Question Image: ${images.questionImage}\n\n`;
              }
              
              if (images.optionImages && images.optionImages.length > 0) {
                enhancedQuestion += 'Options:\n' + 
                  images.optionImages.map(img => `${img.option}: ${img.src}`).join('\n') + '\n\n';
              }
              
              if (questionText.trim()) {
                enhancedQuestion += `Additional Text: ${questionText}\n`;
              }
            }
          }
          
          const isCustomEndpoint = /^https?:\/\//i.test(apiKey) || /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(apiKey);
          
          let answer;
          if (isCustomEndpoint) {
            console.log('🌐 Custom endpoint detected, routing through background script...');
            try {
              const response = await browser.runtime.sendMessage({
                action: 'callCustomEndpoint',
                questionText: enhancedQuestion,
                customPrompt: prompt,
                apiKey: apiKey,
                provider: provider,
                images: images,
                isCodingMode: isCodingMode,
              });
              
              if (response && response.success) {
                answer = response.result;
              } else {
                throw new Error(response?.error || 'Custom endpoint call failed');
              }
            } catch (error) {
              console.error('Error calling custom endpoint via background:', error);
              throw error;
            }
          } else {
            answer = await callAIAPI(enhancedQuestion, prompt, apiKey, provider, images, isCodingMode);
          }
          
          const cleanAnswer = isCodingMode ? answer : formatAnswer(answer);
          this.promptDialog.showAnswer(cleanAnswer, isCodingMode);
          
        } catch (error) {
          console.error('❌ AI request error:', error);
          const errorMessage = error.message || CONFIG.ERRORS.UNKNOWN_ERROR;
          this.promptDialog.showError(errorMessage);
        }
      }

      handleTextSelection(event) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length >= CONFIG.UI.MIN_SELECTION_LENGTH && selection.rangeCount > 0) {
          try {
            const range = selection.getRangeAt(0);
            const nearbyImages = findNearbyImages(range);
            
            this.lastSelection = {
              text: selectedText,
              range: range,
              images: nearbyImages,
            };

            this.magnifyingIcon.show(event, range);
            
          } catch (error) {
            console.error('❌ Error handling selection:', error);
          }
        } else {
          this.magnifyingIcon.hide();
        }
      }

      async handleKeyboardShortcut() {
        if (!isExtensionValid()) {
          this.showExtensionInvalidMessage();
          return;
        }
        
        try {
          const fullPageMode = await getFullPageSelection();
          let textToUse = '';
          let imagesToUse = [];
          
          if (fullPageMode) {
            const fullPageText = document.body.innerText || document.body.textContent || '';
            if (fullPageText.trim()) {
              textToUse = fullPageText.trim();
              const range = document.createRange();
              range.selectNodeContents(document.body);
              imagesToUse = findNearbyImages(range);
            }
          } else {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && selectedText.length >= CONFIG.UI.MIN_SELECTION_LENGTH && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              textToUse = selectedText;
              imagesToUse = findNearbyImages(range);
            } else if (this.lastSelection && this.lastSelection.text) {
              textToUse = this.lastSelection.text;
              imagesToUse = this.lastSelection.images || [];
            }
          }
          
          if (textToUse) {
            this.promptDialog.show(textToUse, imagesToUse);
            this.magnifyingIcon.hide();
            
            setTimeout(() => {
              this.getAnswer();
            }, CONFIG.UI.DIALOG_AUTO_SEND_DELAY);
          } else {
            console.log('Please select some text first or enable full page selection mode');
            alert('Please select some text first or enable full page selection mode in the extension popup.');
          }
        } catch (error) {
          console.error('❌ Error in handleKeyboardShortcut:', error);
          alert('Error processing shortcut. Please try again.');
        }
      }

      attachEventListeners() {
        const debouncedSelectionHandler = debounce(
          (e) => this.handleTextSelection(e),
          CONFIG.UI.ICON_APPEAR_DELAY
        );

        document.addEventListener('mouseup', debouncedSelectionHandler);
        document.addEventListener('keyup', debouncedSelectionHandler);

        document.addEventListener('click', (e) => {
          if (!e.target.closest('#quiz-solver-magnify-icon') && 
              !e.target.closest('#quiz-prompt-dialog')) {
            this.magnifyingIcon.hide();
            this.promptDialog.hide();
          }
        });

        document.addEventListener('scroll', () => {
          this.magnifyingIcon.hide();
          this.promptDialog.hide();
        });

      }
    }

    let quizSolverInstance = null;
    let messageListenerSetup = false;

    function setupMessageListener() {
      if (messageListenerSetup) {
        console.log('⚠️ Message listener already set up');
        return;
      }
      
      try {
        console.log('🔧 Setting up message listener...');
        browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
          console.log('📨 Message received in content script:', request);
          
          if (request.action === 'solveQuestion' && request.text) {
            console.log('📝 Handling solveQuestion action');
            if (!quizSolverInstance) {
              console.log('🔄 Initializing quiz solver...');
              initializeQuizSolver();
            }
            if (quizSolverInstance && quizSolverInstance.promptDialog) {
              try {
                if (!isExtensionValid()) {
                  if (quizSolverInstance) {
                    quizSolverInstance.showExtensionInvalidMessage();
                  }
                  sendResponse({ success: false, error: 'Extension context invalid' });
                  return true;
                }
                quizSolverInstance.promptDialog.show(request.text);
                setTimeout(() => {
                  quizSolverInstance.getAnswer();
                }, CONFIG.UI.DIALOG_AUTO_SEND_DELAY);
                sendResponse({ success: true });
              } catch (error) {
                console.error('❌ Error handling solveQuestion:', error);
                sendResponse({ success: false, error: error.message });
              }
            } else {
              console.error('❌ Content script not ready');
              sendResponse({ success: false, error: 'Content script not ready' });
            }
            return true;
          }
          
          if (request.action === 'solveSelectedText') {
            console.log('⌨️ Handling solveSelectedText action (keyboard shortcut)');
            (async () => {
              try {
                if (!quizSolverInstance) {
                  console.log('🔄 Initializing quiz solver for shortcut...');
                  initializeQuizSolver();
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                if (!quizSolverInstance) {
                  console.error('❌ Failed to initialize quiz solver');
                  sendResponse({ success: false, error: 'Failed to initialize content script' });
                  return;
                }
                
                if (!isExtensionValid()) {
                  console.error('❌ Extension context invalid');
                  quizSolverInstance.showExtensionInvalidMessage();
                  sendResponse({ success: false, error: 'Extension context invalid' });
                  return;
                }
                
                console.log('✅ Calling handleKeyboardShortcut...');
                await quizSolverInstance.handleKeyboardShortcut();
                console.log('✅ handleKeyboardShortcut completed');
                sendResponse({ success: true });
              } catch (error) {
                console.error('❌ Error handling solveSelectedText:', error);
                if (isExtensionContextError(error) && quizSolverInstance) {
                  quizSolverInstance.showExtensionInvalidMessage();
                }
                sendResponse({ success: false, error: error.message });
              }
            })();
            return true;
          }
          
          console.log('⚠️ Unknown action:', request.action);
          return false;
        });
        messageListenerSetup = true;
        console.log('✅ Message listener set up successfully');
      } catch (error) {
        console.error('❌ Failed to setup message listener:', error);
      }
    }

    function initializeQuizSolver() {
      if (quizSolverInstance) {
        return;
      }
      
      try {
        if (typeof browser === 'undefined' || !browser.runtime) {
          return;
        }

        try {
          browser.runtime.id;
        } catch (contextError) {
          return;
        }

        quizSolverInstance = new SmartQuizSolver();
      } catch (error) {
        console.error('❌ Failed to initialize Quiz Solver:', error);
        if (isExtensionContextError(error)) {
          // Context issue detected during initialization
        }
      }
    }

    console.log('🚀 Content script loaded on:', window.location.href);
    setupMessageListener();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeQuizSolver);
    } else {
      initializeQuizSolver();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(initializeQuizSolver, 500);
      });
    }
  },
});
