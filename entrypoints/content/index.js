import { defineContentScript } from 'wxt/sandbox';
import browser from 'webextension-polyfill';
import { CONFIG } from '../shared/config.js';
import { 
  isExtensionValid, 
  safeBrowserCall, 
  getApiKey,
  getProvider,
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

      handleIconClick() {
        if (!isExtensionValid()) {
          this.showExtensionInvalidMessage();
          this.magnifyingIcon.hide();
          return;
        }
        
        if (this.lastSelection && this.lastSelection.text) {
          this.promptDialog.show(
            this.lastSelection.text, 
            this.lastSelection.images || []
          );
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
          
          if (!apiKey) {
            this.promptDialog.showError(CONFIG.ERRORS.API_KEY_MISSING);
            return;
          }

          const questionText = this.promptDialog.getCurrentQuestion();
          const images = this.promptDialog.getCurrentImages();
          
          let enhancedQuestion = enhanceQuestionWithContext(questionText, document);
          
          let prompt = CONFIG.PROMPTS.DEFAULT;
          if (images && (images.questionImage || (images.optionImages && images.optionImages.length > 0))) {
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
          
          const answer = await callAIAPI(enhancedQuestion, prompt, apiKey, provider, images);
          const cleanAnswer = formatAnswer(answer);
          this.promptDialog.showAnswer(cleanAnswer);
          
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

      handleKeyboardShortcut() {
        if (!isExtensionValid()) {
          this.showExtensionInvalidMessage();
          return;
        }
        
        if (this.lastSelection && this.lastSelection.text) {
          this.promptDialog.show(
            this.lastSelection.text,
            this.lastSelection.images || []
          );
          this.magnifyingIcon.hide();
          
          setTimeout(() => {
            this.getAnswer();
          }, CONFIG.UI.DIALOG_AUTO_SEND_DELAY);
        } else {
          console.log('Please select some text first');
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

        try {
          browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
              if (!isExtensionValid()) {
                this.showExtensionInvalidMessage();
                sendResponse({ success: false, error: 'Extension context invalid' });
                return true;
              }

              if (request.action === 'solveQuestion' && request.text) {
                this.promptDialog.show(request.text);
                setTimeout(() => {
                  this.getAnswer();
                }, CONFIG.UI.DIALOG_AUTO_SEND_DELAY);
                sendResponse({ success: true });
              } else if (request.action === 'solveSelectedText') {
                this.handleKeyboardShortcut();
                sendResponse({ success: true });
              }
            } catch (error) {
              console.error('❌ Message listener error:', error);
              if (isExtensionContextError(error)) {
                this.showExtensionInvalidMessage();
              }
              sendResponse({ success: false, error: error.message });
            }
            
            return true;
          });
        } catch (error) {
          console.error('❌ Failed to setup message listener:', error);
          if (isExtensionContextError(error)) {
            this.showExtensionInvalidMessage();
          }
        }
      }
    }

    let quizSolverInstance = null;

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
