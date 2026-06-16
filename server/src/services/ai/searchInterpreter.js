import { generateContent } from '../../config/gemini.js';
import { SEARCH_INTERPRET_SYSTEM_PROMPT } from './prompts.js';

/**
 * Interpret natural language search queries into structured filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function interpretSearch(req, res) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Check if the query looks like natural language (has articles, intent words, etc.)
    const naturalLanguagePatterns = [
      /i need/i, /i want/i, /looking for/i, /searching/i,
      /under \d+/i, /around \d+/i, /about \d+/i,
      /for (a |an )?(student|family|professional|couple)/i,
      /with (a |an )?(wifi|parking|balcony|ac|air condition)/i,
      /quiet/i, /spacious/i, /furnished/i, /near/i,
      /budget/i, /cheap/i, /affordable/i
    ];

    const isNaturalLanguage = naturalLanguagePatterns.some(pattern => pattern.test(query));

    // If it looks like a simple keyword search, don't send to AI
    if (!isNaturalLanguage && query.length < 30) {
      return res.json({
        success: true,
        data: {
          filters: {},
          keywords: query.split(' ').filter(w => w.length > 2),
          intent: 'keyword_search',
          explanation: 'Keyword search detected',
          isNaturalLanguage: false
        }
      });
    }

    // Use AI to interpret natural language queries
    const prompt = `Analyze this search query and return structured filter parameters.\n\nQuery: "${query}"\n\nReturn ONLY a valid JSON object with this structure (no markdown, no explanation):
{
  "filters": {
    "minPrice": number or null,
    "maxPrice": number or null,
    "bedrooms": number or null,
    "bathrooms": number or null
  },
  "amenities": ["array", "of", "amenities"],
  "intent": "single_word_category",
  "explanation": "brief explanation"
}`;

    const response = await generateContent(prompt, SEARCH_INTERPRET_SYSTEM_PROMPT);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to keyword extraction
      parsedResponse = {
        filters: {},
        amenities: [],
        intent: 'general',
        explanation: 'Could not interpret query'
      };
    }

    res.json({
      success: true,
      data: {
        ...parsedResponse,
        isNaturalLanguage: true
      }
    });

  } catch (error) {
    console.error('Search Interpreter Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to interpret search query'
    });
  }
}
