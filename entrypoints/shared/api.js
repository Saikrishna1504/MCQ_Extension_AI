import { CONFIG } from './config.js';
import { formatApiError } from './utils.js';

export async function callAIAPI(questionText, customPrompt, apiKey, provider, images = null) {
  if (provider === CONFIG.PROVIDERS.GEMINI) {
    return await callGeminiAPI(questionText, customPrompt, apiKey, images);
  } else if (provider === CONFIG.PROVIDERS.CHATGPT) {
    return await callChatGPTAPI(questionText, customPrompt, apiKey, images);
  } else {
    throw new Error('Unknown AI provider');
  }
}

async function callGeminiAPI(questionText, customPrompt, apiKey, images = null) {
  const prompt = buildPrompt(questionText, customPrompt, images);
  const url = `${CONFIG.API.GEMINI.BASE_URL}/${CONFIG.API.GEMINI.ENDPOINT}/${CONFIG.API.GEMINI.MODEL}:generateContent?key=${apiKey}`;

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
        generationConfig: CONFIG.GENERATION.GEMINI,
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

async function callChatGPTAPI(questionText, customPrompt, apiKey, images = null) {
  const prompt = buildPrompt(questionText, customPrompt, images);
  const url = `${CONFIG.API.CHATGPT.BASE_URL}/${CONFIG.API.CHATGPT.ENDPOINT}`;

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
        temperature: CONFIG.GENERATION.CHATGPT.temperature,
        max_tokens: CONFIG.GENERATION.CHATGPT.max_tokens,
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
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('❌ Invalid API response format:', data);
      throw new Error('Invalid API response format - no valid answer found');
    }
  } catch (error) {
    console.error('❌ API call error:', error);
    throw new Error(formatApiError(error));
  }
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
