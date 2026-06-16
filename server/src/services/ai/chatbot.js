import { generateChatResponse } from '../../config/gemini.js';
import { CHATBOT_SYSTEM_PROMPT } from './prompts.js';

/**
 * Handle chatbot interaction for room inquiry assistance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function chatWithBot(req, res) {
  try {
    const { message, roomId, roomDetails, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Build condensed room context (bare metrics only)
    let roomContext = 'No specific room selected.';
    if (roomDetails) {
      const size = roomDetails.size_sqm || 'N/A';
      const bedrooms = roomDetails.bedrooms || 'N/A';
      const bathrooms = roomDetails.bathrooms || 'N/A';
      const amenities = roomDetails.amenities?.length ? roomDetails.amenities.join(', ') : 'None';
      const price = roomDetails.price ? `₱${roomDetails.price.toLocaleString()}` : 'N/A';
      
      roomContext = `Room: ${roomDetails.title || 'Unknown'} | ${price}/mo | ${bedrooms}BR/${bathrooms}BA | ${size}sqm | Amenities: ${amenities}`;
    }

    // Combine system prompt with room context
    const fullSystemInstruction = `${CHATBOT_SYSTEM_PROMPT}\n\nCurrent Room Context:\n${roomContext}`;

    // Sliding window: keep only last 6 messages to prevent token accumulation
    const MAX_HISTORY = 6;
    const history = conversationHistory.slice(-MAX_HISTORY).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      text: msg.content || msg.text || ''
    }));

    // Get AI response - user message only (room context is in systemInstruction)
    const response = await generateChatResponse(history, message, fullSystemInstruction);

    // Determine if this inquiry should be flagged for human follow-up
    const shouldFlagForHuman = message.toLowerCase().includes('speak to someone') ||
      message.toLowerCase().includes('talk to an agent') ||
      message.toLowerCase().includes('manager') ||
      message.toLowerCase().includes('complaint');

    res.json({
      success: true,
      data: {
        reply: response,
        shouldFlagForHuman,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response. Please try again or submit a formal inquiry.'
    });
  }
}
