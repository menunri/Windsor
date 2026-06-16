import { generateContent } from '../../config/gemini.js';
import { REPLY_SUGGESTER_SYSTEM_PROMPT } from './prompts.js';

/**
 * Suggest replies for admin to use when responding to inquiries
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function suggestReply(req, res) {
  try {
    const { inquiryId, inquiryData } = req.body;

    if (!inquiryData || !inquiryData.message) {
      return res.status(400).json({
        success: false,
        error: 'Inquiry data with message is required'
      });
    }

    const { inquirerName, inquirerEmail, subject, message } = inquiryData;

    // Build context for the AI
    const prompt = `Analyze this inquiry and generate suggested replies for the Windsor Residence admin.

Inquiry Details:
- From: ${inquirerName || 'Guest'} (${inquirerEmail || 'No email'})
- Subject: ${subject || 'No subject'}
- Message: ${message}

Return ONLY a valid JSON object with this structure:
{
  "category": "availability|pricing|amenities|process|maintenance|general",
  "sentiment": "positive|neutral|negative|urgent",
  "urgency": "normal|high",
  "keyTopics": ["topic1", "topic2"],
  "suggestions": [
    {"text": "Reply template 1 (highest confidence)", "confidence": 0.9},
    {"text": "Reply template 2 (medium confidence)", "confidence": 0.7},
    {"text": "Reply template 3 (lower confidence)", "confidence": 0.5}
  ]
}

Guidelines:
- Replace [GUEST_NAME] with the inquirer's name
- Replace [ROOM_NAME] or [ROOM_NUMBER] with the relevant room if mentioned
- Include specific next steps when applicable
- Keep templates 2-4 sentences long`;

    const response = await generateContent(prompt, REPLY_SUGGESTER_SYSTEM_PROMPT);

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return default suggestions
      parsedResponse = {
        category: 'general',
        sentiment: 'neutral',
        urgency: 'normal',
        keyTopics: [],
        suggestions: [
          {
            text: `Dear ${inquirerName || 'Valued Guest'}, thank you for your inquiry. We have received your message and will get back to you shortly.`,
            confidence: 0.6
          },
          {
            text: `Hello ${inquirerName || 'Guest'}, thank you for reaching out to Windsor Residence. We appreciate your interest and will respond to your inquiry within 24 hours.`,
            confidence: 0.5
          }
        ]
      };
    }

    res.json({
      success: true,
      data: {
        ...parsedResponse,
        inquiryId,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Reply Suggester Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reply suggestions'
    });
  }
}
