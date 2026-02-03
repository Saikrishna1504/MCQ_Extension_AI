import browser from 'webextension-polyfill';
import { CONFIG } from './config.js';

export function isExtensionValid() {
  try {
    if (typeof browser === 'undefined') return false;
    if (!browser.runtime) return false;
    if (!browser.runtime.id) return false;
    
    browser.runtime.id;
    return true;
  } catch (error) {
    return false;
  }
}

export async function safeBrowserCall(callbackFn) {
  try {
    if (!isExtensionValid()) {
      throw new Error('Extension context not available');
    }
    return await callbackFn();
  } catch (error) {
    if (isExtensionContextError(error)) {
      throw new Error(CONFIG.ERRORS.EXTENSION_RELOADED);
    }
    throw error;
  }
}

export function isExtensionContextError(error) {
  const errorMessage = error?.message || '';
  return (
    errorMessage.includes('Extension context') ||
    errorMessage.includes('runtime') ||
    errorMessage.includes('invalidated') ||
    errorMessage.includes('message port closed')
  );
}

export async function getApiKey() {
  return await safeBrowserCall(async () => {
    const response = await Promise.race([
      browser.runtime.sendMessage({ action: 'getApiKey' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.API.TIMEOUT)
      ),
    ]);
    return response?.apiKey;
  });
}

export async function getProvider() {
  return await safeBrowserCall(async () => {
    const response = await Promise.race([
      browser.runtime.sendMessage({ action: 'getProvider' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), CONFIG.API.TIMEOUT)
      ),
    ]);
    return response?.provider || CONFIG.PROVIDERS.GEMINI;
  });
}

export function formatApiError(error) {
  const errorMessage = error?.message || '';
  
  if (isExtensionContextError(error)) {
    return CONFIG.ERRORS.EXTENSION_RELOADED;
  }
  
  if (errorMessage.includes('Request timeout') || errorMessage.includes('timeout')) {
    return CONFIG.ERRORS.REQUEST_TIMEOUT;
  }
  
  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return CONFIG.ERRORS.API_KEY_INVALID;
  }
  
  if (errorMessage.includes('429')) {
    return CONFIG.ERRORS.RATE_LIMIT;
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return CONFIG.ERRORS.NETWORK_ERROR;
  }
  
  return CONFIG.ERRORS.UNKNOWN_ERROR;
}

export function formatAnswer(answer) {
  if (!answer) return '';
  
  return answer
    .replace(/^(Option|Answer|The answer is|It's)\s*:?\s*/i, '')
    .replace(/^\s*([A-D0-9])\s*[:)\.-]\s*(.+)$/i, '$1: $2')
    .trim();
}

export function findNearbyImages(range, maxDistance = 300) {
  const container = range.commonAncestorContainer;
  const searchArea = container.nodeType === Node.TEXT_NODE 
    ? container.parentElement 
    : container;
  
  const images = { questionImage: null, optionImages: [] };
  
  const isImageNearSelection = (img) => {
    const imgRect = img.getBoundingClientRect();
    const selectionRect = range.getBoundingClientRect();
    const verticalDistance = Math.abs(imgRect.top - selectionRect.top);
    const horizontalDistance = Math.abs(imgRect.left - selectionRect.left);
    return verticalDistance < maxDistance && horizontalDistance < maxDistance;
  };
  
  const isOptionImage = (img) => {
    const nearbyText = img.previousElementSibling?.textContent || 
                     img.nextElementSibling?.textContent || 
                     img.parentElement?.textContent || '';
    return /^[A-D1-4\.\)\s]+$/i.test(nearbyText.trim());
  };
  
  const nearbyImgs = searchArea.querySelectorAll('img');
  nearbyImgs.forEach(img => {
    if (isImageNearSelection(img)) {
      if (isOptionImage(img)) {
        const marker = (img.previousElementSibling?.textContent || 
                      img.nextElementSibling?.textContent || 
                      img.parentElement?.textContent || '')
                      .trim().match(/^[A-D1-4]/i)?.[0] || '';
        images.optionImages.push({
          src: img.src,
          option: marker.toUpperCase(),
        });
      } else {
        images.questionImage = img.src;
      }
    }
  });
  
  return images;
}

export function enhanceQuestionWithContext(questionText, document) {
  let context = questionText;
  const pageText = document.body.innerText;
  const questionIndex = pageText.indexOf(questionText);
  
  if (questionIndex === -1) return context;
  
  const start = Math.max(0, questionIndex - 500);
  const end = Math.min(pageText.length, questionIndex + questionText.length + 500);
  const surroundingText = pageText.substring(start, end);
  
  const optionPatterns = [
    /[A-D]\.\s+[^\n]+/g,
    /[A-D]\)\s+[^\n]+/g,
    /\([A-D]\)\s+[^\n]+/g,
    /[1-4]\.\s+[^\n]+/g,
    /[1-4]\)\s+[^\n]+/g,
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
  
  return context;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
