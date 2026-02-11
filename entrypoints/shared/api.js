import { CONFIG } from './config.js';
import { formatApiError, isCustomEndpoint, normalizeEndpointUrl } from './utils.js';

export async function callAIAPI(questionText, customPrompt, apiKey, provider, images = null, isCodingMode = false) {
  if (isCustomEndpoint(apiKey)) {
    return await callCustomEndpointAPI(questionText, customPrompt, apiKey, images, isCodingMode);
  } else if (provider === CONFIG.PROVIDERS.GEMINI) {
    return await callGeminiAPI(questionText, customPrompt, apiKey, images, isCodingMode);
  } else if (provider === CONFIG.PROVIDERS.CHATGPT) {
    return await callChatGPTAPI(questionText, customPrompt, apiKey, images, isCodingMode);
  } else {
    throw new Error('Unknown AI provider');
  }
}

async function callGeminiAPI(questionText, customPrompt, apiKey, images = null, isCodingMode = false) {
  const prompt = buildPrompt(questionText, customPrompt, images);
  const url = `${CONFIG.API.GEMINI.BASE_URL}/${CONFIG.API.GEMINI.ENDPOINT}/${CONFIG.API.GEMINI.MODEL}:generateContent?key=${apiKey}`;
  const generationConfig = isCodingMode ? CONFIG.GENERATION.GEMINI_CODING : CONFIG.GENERATION.GEMINI;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
        generationConfig: generationConfig,
      }),
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
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('❌ Invalid API response format:', data);
      throw new Error('Invalid API response format - no valid answer found');
    }
  } catch (error) {
    console.error('❌ API call error:', error);
    throw new Error(formatApiError(error));
  }
}

async function callChatGPTAPI(questionText, customPrompt, apiKey, images = null, isCodingMode = false) {
  const prompt = buildPrompt(questionText, customPrompt, images);
  const url = `${CONFIG.API.CHATGPT.BASE_URL}/${CONFIG.API.CHATGPT.ENDPOINT}`;
  const generationConfig = isCodingMode ? CONFIG.GENERATION.CHATGPT_CODING : CONFIG.GENERATION.CHATGPT;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.API.CHATGPT.MODEL,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: generationConfig.temperature,
        max_tokens: generationConfig.max_tokens,
      }),
      signal: AbortSignal.timeout(CONFIG.API.TIMEOUT),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        const errorText = await response.text();
        errorData = { error: { message: errorText } };
      }
      const errorMessage = errorData?.error?.message || errorData?.error?.code || 'Unknown error';
      console.error('❌ API Error Response:', errorMessage);
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`API authentication failed (${response.status}). Please check your API key.`);
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const message = retryAfter 
          ? `Rate limit exceeded. Please wait ${retryAfter} seconds and try again.`
          : `Rate limit exceeded. Please try again in a few minutes.`;
        throw new Error(message);
      } else if (response.status === 402 || response.status === 500) {
        throw new Error(`API error: ${errorMessage}. Please check your OpenAI account billing and credits.`);
      } else {
        throw new Error(`API request failed: ${response.status} - ${errorMessage}`);
      }
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('❌ Invalid API response format:', data);
      throw new Error('Invalid API response format - no valid answer found');
    }
  } catch (error) {
    console.error('❌ API call error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error(formatApiError(error));
  }
}

async function callCustomEndpointAPI(questionText, customPrompt, endpointUrl, images = null, isCodingMode = false) {
  const prompt = buildPrompt(questionText, customPrompt, images);
  const generationConfig = isCodingMode ? CONFIG.GENERATION.GEMINI_CODING : CONFIG.GENERATION.GEMINI;
  
  let url = normalizeEndpointUrl(endpointUrl);
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  const possiblePaths = [
    `/v1beta/${CONFIG.API.GEMINI.MODEL}/generateContent`,
    `/v1beta/${CONFIG.API.GEMINI.MODEL}:generateContent`,
    `/v1beta/models/${CONFIG.API.GEMINI.MODEL}:generateContent`,
    `/v1beta/models/${CONFIG.API.GEMINI.MODEL}/generateContent`,
    '/v1/chat/completions',
    '/chat/completions',
    '/completions',
    '/',
  ];
  
  let lastError = null;
  
  for (const path of possiblePaths) {
    const testUrl = baseUrl + path;
    
    try {
      let requestBody;
      let useGeminiFormat = path.includes('v1beta') || path.includes('generateContent');
      
      if (useGeminiFormat) {
        requestBody = {
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: generationConfig,
        };
      } else {
        requestBody = {
          model: CONFIG.API.CHATGPT.MODEL,
          messages: [{
            role: 'user',
            content: prompt,
          }],
          temperature: generationConfig.temperature,
          max_tokens: generationConfig.max_tokens,
        };
      }
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(CONFIG.API.TIMEOUT),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (useGeminiFormat) {
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
          } else if (data.content) {
            return data.content;
          }
        } else {
          if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
          } else if (data.content) {
            return data.content;
          } else if (data.text) {
            return data.text;
          } else if (data.message && typeof data.message === 'string') {
            return data.message;
          } else if (data.response) {
            return data.response;
          }
        }
        
        lastError = new Error('Invalid API response format - no valid answer found');
        continue;
      } else if (response.status === 404) {
        lastError = new Error(`404 Not Found: ${testUrl}`);
        continue;
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: { message: errorText } };
        }
        const errorMessage = errorData?.error?.message || errorData?.detail || errorData?.error?.code || 'Unknown error';
        
        if (response.status === 401 || response.status === 403) {
          throw new Error(`API authentication failed (${response.status}). Please check your endpoint.`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please try again later.`);
        } else if (response.status === 404) {
          lastError = new Error(`404 Not Found: ${testUrl}`);
          continue;
        } else {
          lastError = new Error(`API request failed: ${response.status} - ${errorMessage}`);
          continue;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (error.message.includes('authentication') || error.message.includes('Rate limit')) {
        throw error;
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_')) {
        lastError = new Error(`Failed to connect to ${testUrl}. Error: ${error.message}. Please check: 1) Endpoint is accessible, 2) Endpoint accepts POST requests, 3) No firewall blocking the request.`);
        continue;
      }
      
      lastError = error;
      continue;
    }
  }
  
  if (lastError) {
    const errorMsg = lastError.message || lastError.toString();
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
      throw new Error(`Could not connect to endpoint ${baseUrl}. All paths failed with network errors. Please verify the endpoint is accessible and accepts POST requests.`);
    }
    throw lastError;
  }
  
  throw new Error('Could not find valid endpoint path. Tried: ' + possiblePaths.join(', '));
}

function buildPrompt(questionText, customPrompt, images) {
  let enhancedQuestion = questionText;
  
  if (images) {
    const { questionImage, optionImages } = images;
    
    if (questionImage || (optionImages && optionImages.length > 0)) {
      enhancedQuestion = 'Image-based question:\n';
      
      if (questionImage) {
        enhancedQuestion += `Question Image: ${questionImage}\n\n`;
      }
      
      if (optionImages && optionImages.length > 0) {
        enhancedQuestion += 'Options:\n' + 
          optionImages.map(img => `${img.option}: ${img.src}`).join('\n') + '\n\n';
      }
      
      if (questionText.trim()) {
        enhancedQuestion += `Additional Text: ${questionText}\n`;
      }
    }
  }
  
  return `${customPrompt}\n\nQuestion to analyze:\n${enhancedQuestion}`;
}
