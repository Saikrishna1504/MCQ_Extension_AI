import { CONFIG } from './config.js';
import { isExtensionContextError } from './utils.js';

export class ExtensionNotice {
  constructor() {
    this.notice = null;
  }

  show() {
    const existingMsg = document.querySelector('.extension-invalid-notice');
    if (existingMsg) return;

    this.notice = document.createElement('div');
    this.notice.className = 'extension-invalid-notice';
    this.notice.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: ${CONFIG.UI.Z_INDEX.NOTICE};
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
    this.notice.innerHTML = `
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
    
    document.body.appendChild(this.notice);
    
    setTimeout(() => {
      this.hide();
    }, CONFIG.UI.NOTICE_AUTO_REMOVE_DELAY);
  }

  hide() {
    if (this.notice && this.notice.parentNode) {
      this.notice.remove();
      this.notice = null;
    }
  }
}

export class MagnifyingIcon {
  constructor(onClick) {
    this.icon = null;
    this.onClick = onClick;
    this.create();
  }

  create() {
    this.icon = document.createElement('div');
    this.icon.id = 'quiz-solver-magnify-icon';
    this.icon.innerHTML = '🔍';
    this.icon.className = 'quiz-magnify-icon';
    this.icon.style.display = 'none';
    this.icon.title = 'Click to solve with AI';
    this.icon.setAttribute('role', 'button');
    this.icon.setAttribute('aria-label', 'Solve question with AI');
    
    this.icon.style.cursor = 'pointer';
    this.icon.style.userSelect = 'none';
    this.icon.style.pointerEvents = 'auto';
    this.icon.style.zIndex = CONFIG.UI.Z_INDEX.MAGNIFY_ICON;
    
    this.icon.addEventListener('selectstart', (e) => e.preventDefault());
    this.icon.addEventListener('contextmenu', (e) => e.preventDefault());
    this.icon.addEventListener('dragstart', (e) => e.preventDefault());
    
    this.icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.onClick();
    });

    this.icon.addEventListener('mouseenter', () => {
      this.icon.style.cursor = 'pointer';
    });

    document.body.appendChild(this.icon);
  }

  show(event, range) {
    if (!range) return;

    try {
      const rect = range.getBoundingClientRect();
      
      const iconX = Math.min(rect.right + window.scrollX - 10, window.innerWidth - 40);
      const iconY = Math.max(rect.top + window.scrollY - 35, 10);
      
      this.icon.style.position = 'absolute';
      this.icon.style.left = `${iconX}px`;
      this.icon.style.top = `${iconY}px`;
      this.icon.style.display = 'block';
      this.icon.style.zIndex = CONFIG.UI.Z_INDEX.MAGNIFY_ICON;
      
      this.icon.style.transform = 'scale(0.8)';
      setTimeout(() => {
        if (this.icon.style.display === 'block') {
          this.icon.style.transform = 'scale(1)';
        }
      }, 50);
    } catch (error) {
      console.error('❌ Error positioning magnifying icon:', error);
    }
  }

  hide() {
    if (this.icon) {
      this.icon.style.display = 'none';
    }
  }
}

export class PromptDialog {
  constructor() {
    this.dialog = null;
    this.currentQuestion = null;
    this.currentImages = null;
    this.create();
  }

  create() {
    this.dialog = document.createElement('div');
    this.dialog.id = 'quiz-prompt-dialog';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-labelledby', 'prompt-dialog-title');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.innerHTML = 
      '<div class="prompt-dialog-header">' +
        '<button class="prompt-close-btn" id="prompt-close-btn" aria-label="Close dialog">×</button>' +
      '</div>' +
      '<div class="prompt-answer-content" id="prompt-answer-content">' +
        'Loading...' +
      '</div>';

    document.body.appendChild(this.dialog);

    this.dialog.querySelector('#prompt-close-btn').addEventListener('click', () => {
      this.hide();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  show(questionText, images = []) {
    this.dialog.style.display = 'block';
    this.dialog.style.position = 'fixed';
    this.dialog.style.top = '50%';
    this.dialog.style.left = '50%';
    this.dialog.style.transform = 'translate(-50%, -50%)';
    this.dialog.style.zIndex = CONFIG.UI.Z_INDEX.DIALOG;
    
    this.currentQuestion = questionText;
    this.currentImages = images;
    
    this.showLoading();
  }

  showLoading() {
    const answerContent = this.dialog.querySelector('#prompt-answer-content');
    answerContent.innerHTML = 
      '<div class="prompt-loading">' +
        '<div class="prompt-loading-spinner" aria-label="Loading"></div>' +
        'Getting answer...' +
      '</div>';
  }

  showAnswer(answer, isCodingMode = false) {
    const answerContent = this.dialog.querySelector('#prompt-answer-content');
    
    if (isCodingMode) {
      const formattedCode = this.formatCode(answer);
      answerContent.innerHTML = `
        <div class="code-container">
          <div class="code-header">
            <span class="code-label">📄 Code Solution</span>
            <button class="copy-code-btn" id="copy-code-btn" title="Copy code">
              <span class="copy-icon">📋</span>
              <span class="copy-text">Copy</span>
            </button>
          </div>
          <pre class="code-block"><code id="code-content">${this.escapeHtml(formattedCode)}</code></pre>
        </div>
      `;
      
      const copyBtn = answerContent.querySelector('#copy-code-btn');
      const codeContent = answerContent.querySelector('#code-content');
      
      if (copyBtn && codeContent) {
        copyBtn.addEventListener('click', async () => {
          try {
            const textToCopy = codeContent.textContent || codeContent.innerText;
            await navigator.clipboard.writeText(textToCopy);
            
            const originalText = copyBtn.querySelector('.copy-text').textContent;
            copyBtn.querySelector('.copy-text').textContent = 'Copied!';
            copyBtn.querySelector('.copy-icon').textContent = '✅';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
              copyBtn.querySelector('.copy-text').textContent = originalText;
              copyBtn.querySelector('.copy-icon').textContent = '📋';
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (error) {
            console.error('Failed to copy code:', error);
            copyBtn.querySelector('.copy-text').textContent = 'Failed';
            setTimeout(() => {
              copyBtn.querySelector('.copy-text').textContent = 'Copy';
            }, 2000);
          }
        });
      }
    } else {
      answerContent.innerHTML = answer;
    }
  }

  formatCode(code) {
    if (!code) return '';
    
    const lines = code.split('\n');
    let minIndent = Infinity;
    
    const codeLines = lines.filter(line => line.trim().length > 0);
    if (codeLines.length === 0) return code;
    
    codeLines.forEach(line => {
      const indent = line.match(/^(\s*)/)[0].length;
      if (indent < minIndent) {
        minIndent = indent;
      }
    });
    
    if (minIndent === Infinity || minIndent === 0) {
      return code;
    }
    
    return lines.map(line => {
      if (line.trim().length === 0) return '';
      return line.substring(minIndent);
    }).join('\n');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(errorMessage) {
    const answerContent = this.dialog.querySelector('#prompt-answer-content');
    answerContent.innerHTML = `<div style="color: #ff6b6b;">${errorMessage}</div>`;
  }

  hide() {
    if (this.dialog) {
      this.dialog.style.display = 'none';
      const answerContent = this.dialog.querySelector('#prompt-answer-content');
      if (answerContent) {
        answerContent.innerHTML = 'Loading...';
      }
    }
  }

  isVisible() {
    return this.dialog && this.dialog.style.display === 'block';
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }

  getCurrentImages() {
    return this.currentImages;
  }
}
