export const CONFIG = {
  PROVIDERS: {
    GEMINI: 'gemini',
    CHATGPT: 'chatgpt',
  },

  API: {
    GEMINI: {
      BASE_URL: 'https://generativelanguage.googleapis.com',
      MODEL: 'gemini-2.0-flash',
      ENDPOINT: 'v1beta/models',
    },
    CHATGPT: {
      BASE_URL: 'https://api.openai.com',
      MODEL: 'gpt-4o-mini',
      ENDPOINT: 'v1/chat/completions',
    },
    TIMEOUT: 30000,
    RETRY_DELAY: 1000,
    MAX_RETRIES: 2,
  },

  GENERATION: {
    GEMINI: {
      temperature: 0.2,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 300,
    },
    GEMINI_CODING: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4000,
    },
    CHATGPT: {
      temperature: 0.2,
      max_tokens: 300,
    },
    CHATGPT_CODING: {
      temperature: 0.3,
      max_tokens: 4000,
    },
  },

  UI: {
    MIN_SELECTION_LENGTH: 5,
    ICON_APPEAR_DELAY: 150,
    DIALOG_AUTO_SEND_DELAY: 500,
    NOTICE_AUTO_REMOVE_DELAY: 10000,
    CONTENT_SCRIPT_INJECT_DELAY: 200,
    Z_INDEX: {
      MAGNIFY_ICON: 10001,
      DIALOG: 10002,
      NOTICE: 10003,
    },
  },

  PROMPTS: {
    DEFAULT: 'Give the option letter/number followed by the answer text. Format as "A: [answer]" or "1: [answer]". Be extremely concise.',
    IMAGE_BASED: 'This is an image-based question. Look at the question image and option images carefully. Give the correct option letter/number followed by a brief description. Format as "A: [brief description]" or "1: [brief description]". Be extremely concise.',
    CODING: 'You are solving a coding problem. Analyze all existing code, the complete question statement, and all test cases provided in the page content. Provide the best complete code solution using the existing class structure and methods. Your response should include:\n1. The complete working code that uses the existing class/method structure\n2. Ensure the code passes all test cases including hidden edge cases\n3. Use efficient algorithms and handle all edge cases\n4. Include proper implementation with the existing class name and method signatures\n\nProvide only the complete code solution, ready to use. Do not include explanations unless necessary for understanding the solution.',
  },

  STORAGE: {
    API_KEY: 'apiKey',
    PROVIDER: 'aiProvider',
    FULL_PAGE_SELECTION: 'fullPageSelection',
  },

  ERRORS: {
    EXTENSION_RELOADED: 'Extension was reloaded. Please refresh the page.',
    API_KEY_MISSING: 'Please set up your API key in the extension popup first.',
    API_KEY_INVALID: 'Invalid API key. Please check your setup.',
    REQUEST_TIMEOUT: 'Request timed out. Please try again.',
    RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  },

  SHORTCUTS: {
    SOLVE_QUESTION: 'solve-question',
  },
};
