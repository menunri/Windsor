// OpenRouter API configuration
// OpenRouter provides free access to various AI models

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Free model available on OpenRouter
const MODEL_NAME = 'openai/gpt-3.5-turbo';

/**
 * Make a request to OpenRouter API
 * @param {Object} options - Request options
 * @returns {Promise<Object>} API response
 */
async function openRouterRequest(options) {
  const { model = MODEL_NAME, messages, systemInstruction, temperature = 0.8, max_tokens = 1024 } = options;
  
  try {
    console.log('[DEBUG OpenRouter] Model:', model);
    console.log('[DEBUG OpenRouter] Messages count:', messages?.length);
    
    const requestBody = {
      model: model,
      messages: []
    };
    
    // Add system instruction as a system message
    if (systemInstruction) {
      requestBody.messages.push({
        role: 'system',
        content: systemInstruction
      });
    }
    
    // Add chat history
    if (messages && messages.length > 0) {
      requestBody.messages.push(...messages);
    }
    
    requestBody.temperature = temperature;
    requestBody.max_tokens = max_tokens;
    
    console.log('[DEBUG OpenRouter] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Windsor Residence API'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG OpenRouter] Error response:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[DEBUG OpenRouter] Response received:', data.choices?.[0]?.message?.content?.substring(0, 100));
    
    return data;
  } catch (error) {
    console.error('[DEBUG OpenRouter] Request failed:', error.message);
    throw error;
  }
}

/**
 * Generate content using OpenRouter AI
 * @param {string} prompt - The prompt to send
 * @param {string} systemInstruction - Optional system instruction
 * @returns {Promise<string>} The generated text
 */
export async function generateContent(prompt, systemInstruction = null) {
  try {
    const messages = [{
      role: 'user',
      content: prompt
    }];
    
    const result = await openRouterRequest({
      messages,
      systemInstruction
    });
    
    return result.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Generate content with chat history for conversational AI
 * @param {Array} history - Array of {role, text} message objects
 * @param {string} newMessage - The new message to respond to
 * @param {string} systemInstruction - Optional system instruction
 * @returns {Promise<string>} The generated response
 */
export async function generateChatResponse(history, newMessage, systemInstruction = null) {
  try {
    console.log('[DEBUG OpenRouter] History length:', history?.length);
    console.log('[DEBUG OpenRouter] History sample:', JSON.stringify(history?.slice(0, 2)));
    console.log('[DEBUG OpenRouter] New message:', newMessage?.substring(0, 100));
    
    // Convert history to OpenRouter format
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Add the new user message
    messages.push({
      role: 'user',
      content: newMessage
    });
    
    const result = await openRouterRequest({
      messages,
      systemInstruction,
      temperature: 0.8,
      max_tokens: 1024
    });
    
    return result.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter Chat Error:', error.message);
    throw new Error(`AI chat failed: ${error.message}`);
  }
}

/**
 * List available models (OpenRouter doesn't have a direct list, returns hardcoded popular models)
 * @returns {Promise<Array>} List of available models
 */
export async function listModels() {
  return {
    models: [
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Free)' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Free)' },
      { id: 'google/gemini-pro', name: 'Gemini Pro (Free)' },
      { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B (Free)' }
    ]
  };
}

// Keep genAI as alias for compatibility
const genAI = { openRouterRequest };

export default genAI;
