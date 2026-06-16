import { generateContent } from '../../config/gemini.js';
import { DESCRIPTION_GENERATOR_SYSTEM_PROMPT } from './prompts.js';

/**
 * Generate a room description from room specifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateDescription(req, res) {
  try {
    const { 
      title, 
      bedrooms, 
      bathrooms, 
      area, 
      floor, 
      unitNumber, 
      amenities = [], 
      price,
      existingDescription 
    } = req.body;

    // Validate required fields
    if (!bedrooms || !bathrooms) {
      return res.status(400).json({
        success: false,
        error: 'Bedrooms and bathrooms are required'
      });
    }

    // Build room specification string
    const specs = [];
    if (bedrooms) specs.push(`${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}`);
    if (bathrooms) specs.push(`${bathrooms} bathroom${bathrooms > 1 ? 's' : ''}`);
    if (area) specs.push(`${area} sqm`);
    if (floor) specs.push(`on floor ${floor}`);
    if (unitNumber) specs.push(`Unit ${unitNumber}`);
    
    const specString = specs.join(', ');

    // Build amenities string
    const amenitiesStr = amenities.length > 0 ? amenities.join(', ') : 'all essential amenities';

    // Build the prompt
    let prompt = `Generate a compelling room description for Windsor Residence.

Room Specifications:
- ${specString}
- Amenities: ${amenitiesStr}
- Price: ₱${(price || 0).toLocaleString()}/month
`;

    if (title) {
      prompt += `- Room Name/Title: ${title}\n`;
    }

    if (existingDescription) {
      prompt += `\nExisting Description (for reference, don't copy):\n${existingDescription}\n`;
    }

    prompt += `\nWrite a fresh, engaging description based on the specifications above.`;

    // Generate description
    const description = await generateContent(prompt, DESCRIPTION_GENERATOR_SYSTEM_PROMPT);

    res.json({
      success: true,
      data: {
        description: description.trim(),
        confidence: 0.85, // Placeholder confidence score
        specsUsed: {
          bedrooms,
          bathrooms,
          area,
          floor,
          unitNumber,
          amenitiesCount: amenities.length
        }
      }
    });

  } catch (error) {
    console.error('Description Generator Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate description'
    });
  }
}
