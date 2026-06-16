import { generateContent, generateChatResponse } from '../../config/gemini.js';

/**
 * AI Analytics Engine
 * Shared AI functions for all analytics features
 */

// ============ Sentiment Analysis ============

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<{sentiment: string, confidence: number, keyPhrases: string[]}>}
 */
export async function analyzeSentiment(text) {
  if (!text || text.length < 3) {
    return { sentiment: 'neutral', confidence: 0.5, keyPhrases: [] };
  }

  const prompt = `Analyze the sentiment of this text and return a JSON object.

Text: "${text.substring(0, 500)}"

Return ONLY a valid JSON object with this structure:
{
  "sentiment": "positive|neutral|negative|urgent",
  "confidence": 0.0-1.0,
  "keyPhrases": ["phrase1", "phrase2", "phrase3"]
}

Rules:
- urgent is for time-sensitive or frustrated messages
- positive for enthusiastic, satisfied, or interested messages
- negative for complaints, disappointments, or dissatisfied messages
- neutral for informational or balanced messages
- Extract 2-4 key phrases that convey the sentiment`;

  try {
    const response = await generateContent(prompt);
    const parsed = parseJsonResponse(response);
    return parsed || { sentiment: 'neutral', confidence: 0.5, keyPhrases: [] };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return { sentiment: 'neutral', confidence: 0.5, keyPhrases: [] };
  }
}

// ============ Text Classification ============

const INQUIRY_CATEGORIES = ['availability', 'pricing', 'amenities', 'process', 'maintenance', 'general'];

/**
 * Classify inquiry into a category
 * @param {string} text - Inquiry text
 * @returns {Promise<{category: string, confidence: number}>}
 */
export async function classifyInquiry(text) {
  if (!text || text.length < 3) {
    return { category: 'general', confidence: 0.5 };
  }

  const prompt = `Classify this inquiry message into ONE category.

Categories:
- availability: Questions about room availability, scheduling viewings
- pricing: Questions about rent, deposits, payment terms
- amenities: Questions about included amenities, features, utilities
- process: Questions about rental process, requirements, documents
- maintenance: Reports of issues, requests for repairs
- general: Questions not fitting other categories

Inquiry: "${text.substring(0, 500)}"

Return ONLY a valid JSON object:
{"category": "category_name", "confidence": 0.0-1.0}`;

  try {
    const response = await generateContent(prompt);
    const parsed = parseJsonResponse(response);
    
    if (parsed && INQUIRY_CATEGORIES.includes(parsed.category)) {
      return { category: parsed.category, confidence: parsed.confidence || 0.7 };
    }
    return { category: 'general', confidence: 0.5 };
  } catch (error) {
    console.error('Classification error:', error);
    return { category: 'general', confidence: 0.5 };
  }
}

// ============ Natural Language Query Translation ============

const DATA_SCHEMA = `
Available Analytics Data:
- inquiries: { total, pending, replied, closed, responseRate, byRoom{}, byDay[] }
- rooms: { total, active, inactive, byBedrooms{}, avgPrice, occupancyRate, recentRooms[] }
- reservations: { total, pending, confirmed, completed, cancelled, totalRevenue, conversionRate }
- users: { total, newThisPeriod, activeThisPeriod }
- reviews: { total, avgRating, recent[] }
- trends: { inquiries, reservations, revenue } over time

Metrics available: counts, percentages, averages, trends by day/week/month
`;

/**
 * Translate natural language question to data query and provide answer
 * @param {string} question - User's question in natural language
 * @param {Object} analyticsData - Current analytics data
 * @returns {Promise<{answer: string, relevantData: Object, suggestedFollowUps: string[]}>}
 */
export async function translateAndAnswerQuery(question, analyticsData) {
  const systemInstruction = `You are Windsor Analytics AI, helping an admin understand their rental business data.

You have access to current analytics data. Your job is to:
1. Understand the admin's question
2. Find relevant data points
3. Give a clear, helpful answer with numbers in context
4. Suggest 2-3 relevant follow-up questions

Data Schema:${DATA_SCHEMA}

Guidelines:
- Always provide specific numbers from the data
- Compare to previous periods when relevant (e.g., "up 15% from last month")
- If data doesn't directly answer, say what would help
- Keep answers conversational but informative
- Highlight anything that needs attention (low response rate, high pending inquiries, etc.)`;

  const userMessage = `Question: ${question}

Current Analytics Data:
${formatAnalyticsForPrompt(analyticsData)}

Provide a helpful answer with specific numbers.`;

  try {
    const response = await generateChatResponse([], userMessage, systemInstruction);
    
    const suggestedFollowUps = generateFollowUpQuestions(question, analyticsData);
    
    return {
      answer: response,
      relevantData: extractRelevantData(question, analyticsData),
      suggestedFollowUps
    };
  } catch (error) {
    console.error('NL Query error:', error);
    return {
      answer: "I'm having trouble analyzing that question right now. Could you try rephrasing?",
      relevantData: {},
      suggestedFollowUps: [
        "How many inquiries did we get this month?",
        "What's our current occupancy rate?",
        "Which rooms have the most inquiries?"
      ]
    };
  }
}

// ============ Report Generation ============

/**
 * Generate automated analytics report
 * @param {Object} data - Analytics data
 * @param {string} reportType - Type: 'dashboard' | 'inquiries' | 'rooms' | 'summary'
 * @returns {Promise<{summary: string, highlights: Array, anomalies: Array, recommendations: Array}>}
 */
export async function generateReport(data, reportType = 'dashboard') {
  const prompt = `Generate an AI-powered analytics report for Windsor Residence admin.

Report Type: ${reportType}

Analytics Data:
${formatAnalyticsForPrompt(data)}

Return ONLY a valid JSON object:
{
  "summary": "2-3 sentence overview of the period",
  "highlights": [
    {"metric": "metric name", "value": "number", "change": "+/-% or context", "note": "optional insight"}
  ],
  "anomalies": [
    {"type": "spike|drop|warning", "severity": "high|medium|low", "description": "what was detected"}
  ],
  "recommendations": [
    {"action": "specific action to take", "reason": "why this matters"}
  ]
}

Rules:
- Keep highlights to 3-5 most important metrics
- Only report anomalies if something unusual is detected
- Recommendations should be actionable and specific
- Use context (e.g., "highest in 3 months") not just raw numbers`;

  try {
    const response = await generateContent(prompt);
    const parsed = parseJsonResponse(response);
    
    if (parsed) {
      return {
        summary: parsed.summary || 'No summary available.',
        highlights: parsed.highlights || [],
        anomalies: parsed.anomalies || [],
        recommendations: parsed.recommendations || []
      };
    }
    
    return generateFallbackReport(data, reportType);
  } catch (error) {
    console.error('Report generation error:', error);
    return generateFallbackReport(data, reportType);
  }
}

// ============ Inquiry Intelligence ============

/**
 * Analyze inquiry for triage
 * @param {Object} inquiry - Inquiry data
 * @returns {Promise<{category, sentiment, urgency, topics, recommendedAction}>}
 */
export async function analyzeInquiry(inquiry) {
  const [sentimentResult, categoryResult] = await Promise.all([
    analyzeSentiment(inquiry.message),
    classifyInquiry(inquiry.message)
  ]);

  const urgency = detectUrgency(inquiry.message, sentimentResult.sentiment);
  const topics = extractTopics(inquiry.message);
  const recommendedAction = getRecommendedAction(categoryResult.category, sentimentResult.sentiment, urgency);

  return {
    category: categoryResult.category,
    categoryConfidence: categoryResult.confidence,
    sentiment: sentimentResult.sentiment,
    sentimentConfidence: sentimentResult.confidence,
    keyPhrases: sentimentResult.keyPhrases,
    urgency,
    topics,
    recommendedAction
  };
}

// ============ Room Performance Insights ============

/**
 * Generate room performance insights
 * @param {Object} room - Room data
 * @param {Object} roomAnalytics - Inquiry and reservation data for this room
 * @returns {Promise<{insights: Object, recommendations: Array}>}
 */
export async function getRoomPerformanceInsights(room, roomAnalytics) {
  const prompt = `Analyze this room's performance and provide insights.

Room: ${room.title}
Price: ₱${room.price?.toLocaleString() || 'N/A'}/month
Bedrooms: ${room.bedrooms}, Bathrooms: ${room.bathrooms}
Area: ${room.area || 'N/A'} sqm

Performance Data:
- Total Inquiries: ${roomAnalytics.inquiries || 0}
- Pending Inquiries: ${roomAnalytics.pending || 0}
- Reservations: ${roomAnalytics.reservations || 0}
- Confirmed Bookings: ${roomAnalytics.confirmed || 0}

Return ONLY a valid JSON object:
{
  "performanceScore": "high|medium|low",
  "inquiryConversionRate": percentage,
  "avgInquiryToBookingDays": number,
  "priceCompetitiveness": "underpriced|fair|overpriced",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": [
    {"action": "specific action", "reason": "why", "priority": "high|medium|low"}
  ]
}`;

  try {
    const response = await generateContent(prompt);
    const parsed = parseJsonResponse(response);
    
    if (parsed) {
      return {
        performanceScore: parsed.performanceScore || 'medium',
        inquiryConversionRate: parsed.inquiryConversionRate || 0,
        avgInquiryToBookingDays: parsed.avgInquiryToBookingDays || 0,
        priceCompetitiveness: parsed.priceCompetitiveness || 'fair',
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || []
      };
    }
    
    return getDefaultRoomInsights(room, roomAnalytics);
  } catch (error) {
    console.error('Room insights error:', error);
    return getDefaultRoomInsights(room, roomAnalytics);
  }
}

// ============ Helper Functions ============

function parseJsonResponse(response) {
  if (!response) return null;
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('JSON parse error:', e);
  }
  return null;
}

function formatAnalyticsForPrompt(data) {
  return JSON.stringify(data, null, 2);
}

function detectUrgency(text, sentiment) {
  const urgentKeywords = ['asap', 'urgent', 'immediately', 'emergency', 'soon', 'deadline'];
  const textLower = text.toLowerCase();
  
  if (sentiment === 'urgent' || urgentKeywords.some(k => textLower.includes(k))) {
    return 'high';
  }
  
  const mediumKeywords = ['soon', 'when possible', 'this week', 'looking to'];
  if (mediumKeywords.some(k => textLower.includes(k))) {
    return 'medium';
  }
  
  return 'normal';
}

function extractTopics(text) {
  const topics = [];
  const textLower = text.toLowerCase();
  
  const topicKeywords = {
    'viewing': ['viewing', 'visit', 'see', 'schedule'],
    'pricing': ['price', 'rent', 'cost', 'budget', 'cheap', 'expensive', 'discount'],
    'availability': ['available', 'availability', 'open', 'booked', 'occupied'],
    'amenities': ['wifi', 'parking', 'ac', 'furnished', 'amenities', 'facilities'],
    'location': ['location', 'area', 'near', '地址', 'location'],
    'pet': ['pet', 'animal', 'dog', 'cat'],
    'lease': ['lease', 'contract', 'term', 'monthly', 'yearly']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => textLower.includes(k))) {
      topics.push(topic);
    }
  }
  
  return topics.slice(0, 5);
}

function getRecommendedAction(category, sentiment, urgency) {
  if (urgency === 'high') {
    return 'priority_response';
  }
  
  if (category === 'availability') {
    return sentiment === 'positive' ? 'quick_response' : 'check_availability';
  }
  
  if (category === 'pricing') {
    return 'send_pricing_info';
  }
  
  if (category === 'maintenance') {
    return 'flag_maintenance';
  }
  
  return 'standard_response';
}

function generateFollowUpQuestions(question, data) {
  const qLower = question.toLowerCase();
  
  if (qLower.includes('inquiry') || qLower.includes('inquiries')) {
    return [
      'Which room got the most inquiries?',
      'What is our inquiry response rate?',
      'How do inquiries compare to last month?'
    ];
  }
  
  if (qLower.includes('room') || qLower.includes('rooms')) {
    return [
      'What is our current occupancy rate?',
      'Which rooms are underperforming?',
      'What is our average room price?'
    ];
  }
  
  if (qLower.includes('revenue') || qLower.includes('money') || qLower.includes('sales')) {
    return [
      'What is our revenue trend?',
      'Which room generates the most revenue?',
      'What is our booking conversion rate?'
    ];
  }
  
  return [
    'How are our inquiry response times?',
    'What is our customer sentiment?',
    'Any anomalies I should know about?'
  ];
}

function extractRelevantData(question, data) {
  const qLower = question.toLowerCase();
  const relevant = {};
  
  if (qLower.includes('inquiry')) {
    relevant.inquiries = data.inquiries;
  }
  if (qLower.includes('room') || qLower.includes('occupancy')) {
    relevant.rooms = data.rooms;
  }
  if (qLower.includes('reservation') || qLower.includes('booking')) {
    relevant.reservations = data.reservations;
  }
  if (qLower.includes('user') || qLower.includes('customer')) {
    relevant.users = data.users;
  }
  if (qLower.includes('review') || qLower.includes('rating')) {
    relevant.reviews = data.reviews;
  }
  
  return Object.keys(relevant).length > 0 ? relevant : data;
}

function generateFallbackReport(data, reportType) {
  const highlights = [];
  
  if (data.inquiries) {
    highlights.push({
      metric: 'Total Inquiries',
      value: data.inquiries.total || 0,
      change: data.inquiries.responseRate ? `Response rate: ${data.inquiries.responseRate}%` : null
    });
  }
  
  if (data.rooms) {
    highlights.push({
      metric: 'Active Rooms',
      value: data.rooms.active || 0,
      note: `Occupancy: ${data.rooms.occupancyRate || 0}%`
    });
  }
  
  if (data.reservations) {
    highlights.push({
      metric: 'Total Revenue',
      value: `₱${(data.reservations.totalRevenue || 0).toLocaleString()}`,
      change: `Conversion: ${data.reservations.conversionRate || 0}%`
    });
  }
  
  return {
    summary: `This period showed ${data.inquiries?.total || 0} inquiries and ${data.reservations?.total || 0} reservations.`,
    highlights,
    anomalies: [],
    recommendations: []
  };
}

function getDefaultRoomInsights(room, analytics) {
  return {
    performanceScore: analytics.inquiries > 5 ? 'high' : analytics.inquiries > 2 ? 'medium' : 'low',
    inquiryConversionRate: analytics.reservations > 0 && analytics.inquiries > 0
      ? Math.round((analytics.reservations / analytics.inquiries) * 100)
      : 0,
    avgInquiryToBookingDays: 0,
    priceCompetitiveness: 'fair',
    strengths: [],
    weaknesses: [],
    recommendations: []
  };
}
