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
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.create();
  }

  create() {
    this.dialog = document.createElement('div');
    this.dialog.id = 'quiz-prompt-dialog';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-labelledby', 'prompt-dialog-title');
    this.dialog.setAttribute('aria-modal', 'true');
    this.dialog.innerHTML = 
      '<div class="prompt-dialog-header" id="prompt-dialog-header">' +
        '<span class="prompt-drag-handle" title="Drag to move">⋮⋮</span>' +
        '<button class="prompt-close-btn" id="prompt-close-btn" aria-label="Close dialog">×</button>' +
      '</div>' +
      '<div class="prompt-answer-content" id="prompt-answer-content">' +
        'Loading...' +
      '</div>';

    document.body.appendChild(this.dialog);

    this.setupDragHandlers();
    this.setupCloseHandler();
    this.setupKeyboardHandler();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.ensureInViewport();
      });
    }
  }

  setupDragHandlers() {
    const header = this.dialog.querySelector('#prompt-dialog-header');
    if (!header) return;

    header.style.cursor = 'move';
    
    header.addEventListener('mousedown', (e) => {
      // Don't start drag if clicking on close button
      if (e.target.closest('.prompt-close-btn')) {
        return;
      }
      
      this.isDragging = true;
      const rect = this.dialog.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      
      // If dialog is centered, convert to absolute positioning
      if (this.dialog.style.transform && this.dialog.style.transform.includes('translate')) {
        const currentLeft = rect.left;
        const currentTop = rect.top;
        this.dialog.style.left = `${currentLeft}px`;
        this.dialog.style.top = `${currentTop}px`;
        this.dialog.style.transform = 'none';
        this.dialog.style.margin = '0';
      }
      
      this.dialog.style.cursor = 'move';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const dialogWidth = this.dialog.offsetWidth;
      const dialogHeight = this.dialog.offsetHeight;
      const maxX = window.innerWidth - dialogWidth;
      const maxY = window.innerHeight - dialogHeight;
      
      let newX = e.clientX - this.dragOffset.x;
      let newY = e.clientY - this.dragOffset.y;
      
      // Constrain to viewport with some padding
      const padding = 10;
      newX = Math.max(padding, Math.min(newX, maxX - padding));
      newY = Math.max(padding, Math.min(newY, maxY - padding));
      
      this.dialog.style.left = `${newX}px`;
      this.dialog.style.top = `${newY}px`;
      this.dialog.style.transform = 'none';
      this.dialog.style.margin = '0';
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dialog.style.cursor = '';
        if (header) {
          header.style.cursor = 'move';
        }
      }
    });
  }

  setupCloseHandler() {
    const closeBtn = this.dialog.querySelector('#prompt-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
    }
  }

  setupKeyboardHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  show(questionText, images = []) {
    this.dialog.style.display = 'flex';
    this.dialog.style.position = 'fixed';

    // Always re-center on open
    this.dialog.style.top = '50%';
    this.dialog.style.left = '50%';
    this.dialog.style.transform = 'translate(-50%, -50%)';
    this.dialog.style.margin = '0';
    
    this.dialog.style.zIndex = CONFIG.UI.Z_INDEX.DIALOG;
    
    this.currentQuestion = questionText;
    this.currentImages = images;
    
    this.showLoading();
    this.ensureInViewport();
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
            <div class="code-header-actions">
              <button class="copy-code-btn" id="copy-code-btn" title="Copy code">
                <span class="copy-icon">📋</span>
                <span class="copy-text">Copy</span>
              </button>
            </div>
          </div>
          <div class="code-block-wrapper">
            <pre class="code-block"><code id="code-content">${this.escapeHtml(formattedCode)}</code></pre>
          </div>
        </div>
      `;
      
      const copyBtn = answerContent.querySelector('#copy-code-btn');
      const codeContent = answerContent.querySelector('#code-content');
      
      if (copyBtn && codeContent) {
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
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

      const codeWrapper = answerContent.querySelector('.code-block-wrapper');
      if (codeWrapper) {
        this.setupCodePanning(codeWrapper);
      }
    } else {
      answerContent.innerHTML = `<div style="padding: 20px; overflow-y: auto; overflow-x: auto; flex: 1; min-height: 0; max-height: calc(90vh - 60px); scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.4) rgba(0, 0, 0, 0.2);">${answer}</div>`;
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
    answerContent.innerHTML = `<div style="padding: 20px; color: #ff6b6b; overflow-y: auto; overflow-x: auto; flex: 1; min-height: 0; max-height: calc(90vh - 60px); scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.4) rgba(0, 0, 0, 0.2);">${errorMessage}</div>`;
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
    return this.dialog && (this.dialog.style.display === 'flex' || this.dialog.style.display === 'block');
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }

  getCurrentImages() {
    return this.currentImages;
  }
  
  ensureInViewport() {
    if (!this.dialog || this.dialog.style.display === 'none') {
      return;
    }

    const rect = this.dialog.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;
    const width = rect.width;
    const height = rect.height;
    const padding = 10;

    // If still using translate(-50%, -50%), convert to explicit left/top
    if (this.dialog.style.transform && this.dialog.style.transform.includes('translate')) {
      this.dialog.style.left = `${rect.left}px`;
      this.dialog.style.top = `${rect.top}px`;
      this.dialog.style.transform = 'none';
      this.dialog.style.margin = '0';
      left = rect.left;
      top = rect.top;
    }

    const maxLeft = Math.max(padding, window.innerWidth - width - padding);
    const maxTop = Math.max(padding, window.innerHeight - height - padding);

    left = Math.min(Math.max(left, padding), maxLeft);
    top = Math.min(Math.max(top, padding), maxTop);

    this.dialog.style.left = `${left}px`;
    this.dialog.style.top = `${top}px`;
  }
  
  setupCodePanning(wrapper) {
    let isPanning = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    const DRAG_THRESHOLD = 5; // pixels to move before starting pan

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      // Avoid starting pan when clicking buttons or links
      if (e.target.closest('.code-header') || 
          e.target.closest('.copy-code-btn') || 
          e.target.closest('.code-close-btn') ||
          e.target.closest('a') ||
          e.target.closest('button')) {
        return;
      }
      
      // Allow text selection - don't prevent default yet
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = wrapper.scrollLeft;
      scrollTop = wrapper.scrollTop;
    };

    const onMouseMove = (e) => {
      if (hasMoved === false) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        
        // Only start panning if moved beyond threshold
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          hasMoved = true;
          isPanning = true;
          wrapper.classList.add('is-panning');
          wrapper.style.cursor = 'grabbing';
          wrapper.style.userSelect = 'none';
          // Now prevent default to stop text selection
          e.preventDefault();
        }
      }
      
      if (isPanning) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        wrapper.scrollLeft = scrollLeft - dx;
        wrapper.scrollTop = scrollTop - dy;
        e.preventDefault();
      }
    };

    const endPan = () => {
      if (isPanning) {
        isPanning = false;
        wrapper.classList.remove('is-panning');
        wrapper.style.cursor = '';
        wrapper.style.userSelect = '';
      }
      hasMoved = false;
    };

    // Touch events for mobile
    const onTouchStart = (e) => {
      if (e.target.closest('.code-header') || 
          e.target.closest('.copy-code-btn') || 
          e.target.closest('.code-close-btn')) {
        return;
      }
      const touch = e.touches[0];
      hasMoved = false;
      startX = touch.clientX;
      startY = touch.clientY;
      scrollLeft = wrapper.scrollLeft;
      scrollTop = wrapper.scrollTop;
    };

    const onTouchMove = (e) => {
      if (hasMoved === false) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - startX);
        const dy = Math.abs(touch.clientY - startY);
        
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          hasMoved = true;
          isPanning = true;
          wrapper.classList.add('is-panning');
          wrapper.style.userSelect = 'none';
        }
      }
      
      if (isPanning) {
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        wrapper.scrollLeft = scrollLeft - dx;
        wrapper.scrollTop = scrollTop - dy;
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      endPan();
    };

    wrapper.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endPan);
    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd);
  }
}
