# AI-Powered Analytics Architecture

## Overview

This plan adds AI-powered analytics to the Windsor admin dashboard, implementing four integrated features that share common infrastructure.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD UI                               │
├─────────────────────────────────────────────────────────────────────────┤
│  [Stats Cards]  [Analytics AI Panel]  [Inquiry Intelligence]  [Reports]│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │     Shared AI Service Layer   │
                    │   (analyticsEngine.js)        │
                    ├───────────────────────────────┤
                    │ • Sentiment Analysis         │
                    │ • Text Classification        │
                    │ • Report Generation           │
                    │ • NL to Query Translation     │
                    └───────────────┬───────────────┘
                                    │
┌───────────────────────────────────┴───────────────────────────────────┐
│                        Analytics Data Layer                            │
├─────────────────────────────────────────────────────────────────────────┤
│  /api/analytics/inquiries  /api/analytics/rooms  /api/analytics/stats │
└─────────────────────────────────────────────────────────────────────────┘
```

## Shared Components

### 1. Analytics Data Aggregation (`/server/src/routes/analytics.js`)

New endpoint that provides structured data for all AI features:

```javascript
// GET /api/analytics/overview
{
  inquiries: { total, pending, replied, closed, byDay[], byCategory{} },
  rooms: { total, active, occupancyRate, popular[], avgPrice },
  reservations: { total, byStatus{}, revenue, byMonth[] },
  users: { total, newThisMonth, active },
  reviews: { avgRating, count, recent[] }
}

// GET /api/analytics/inquiries/sentiment
{ inquiries: [{ id, sentiment, category, urgency, topics[] }] }
```

### 2. AI Analytics Engine (`/server/src/services/ai/analyticsEngine.js`)

Centralized service containing reusable AI functions:

```javascript
// Sentiment Analysis (used by Inquiry Intelligence + Reports)
analyzeSentiment(text) → { sentiment, confidence, keyPhrases }

// Text Classification (used by Inquiry Intelligence)
classifyText(text, categories[]) → { category, confidence }

// Natural Language to Query Translation
translateToQuery(nlQuestion, dataSchema) → { sql-like query description, dataPoints }

// Report Generation (used by Automated Reports)
generateSummary(data, reportType) → { summary, highlights, anomalies[] }

// Anomaly Detection (used by Automated Reports)
detectAnomalies(data, metric) → { anomalies[], severity }
```

## Feature Implementation

### Feature 1: Natural Language Query (AI Chat Panel)

**Backend**: `/server/src/routes/ai.js` - `analyticsQuery` endpoint
**Frontend**: `AIAnalyticsChat` component in Dashboard

**User Experience**: Admin types "Which rooms got the most inquiries this month?" and gets:

- A natural language answer
- Optional: a small chart or data table
- Suggested follow-up questions

**AI Prompt Design**:

```
System: You are Windsor Analytics AI. Given the admin's question and the available
data schema, provide a helpful answer with relevant numbers and insights.

Available data: inquiries, rooms, reservations, users, reviews
Data includes: timestamps, categories, status, prices, ratings, user activity

Rules:
- Answer in plain English
- Highlight key numbers with context
- If data is insufficient, say what additional tracking would help
- Suggest 2-3 relevant follow-up questions
```

### Feature 2: Inquiry Intelligence

**Backend**: Extend existing `/server/src/routes/ai.js` - `suggestReply`
**Frontend**: Badge indicators on Inquiry list + detail page AI panel

**Enhancement**: Instead of just suggesting replies, also:

- Pre-classify incoming inquiries by category (availability, pricing, amenities, etc.)
- Detect sentiment and urgency
- Cluster similar inquiries
- Suggest priority sorting

**New endpoint**: `POST /api/ai/inquiry/analyze`

```javascript
Request: { inquiryId, message, inquirerEmail }
Response: {
  category, sentiment, urgency, topics[],
  similarInquiries[], recommendedAction
}
```

### Feature 3: Room Performance Insights

**Backend**: `/server/src/routes/ai.js` - `roomInsights` endpoint
**Frontend**: Room cards show AI insights badge + detailed modal

**Insights Generated**:

- Price competitiveness (vs. market average in area)
- Inquiry-to-booking conversion rate
- Seasonal demand indicators
- Amenity impact analysis
- Recommended actions

**New endpoint**: `POST /api/ai/rooms/insights`

```javascript
Request: { roomId, period: '7d' | '30d' | '90d' }
Response: {
  inquiryCount, viewCount, conversionRate,
  avgResponseTime, sentimentBreakdown,
  recommendations[], priceSuggestion
}
```

### Feature 4: Automated Report Generation

**Backend**: `/server/src/routes/ai.js` - `generateReport` endpoint
**Frontend**: "AI Summary" toggle on Dashboard + Report page

**Reports Generated**:

- Daily/Weekly Dashboard summary (natural language)
- Inquiry response performance report
- Room performance comparison
- Anomaly alerts (unusual spikes/drops)

**New endpoint**: `POST /api/ai/reports/generate`

```javascript
Request: { reportType: 'dashboard' | 'inquiries' | 'rooms', period }
Response: {
  summary: "This week had 23 inquiries, up 15% from last week...",
  highlights: [{ metric, change, note }],
  anomalies: [{ type, severity, description }],
  recommendations: [{ action, reason }]
}
```

## Database Schema Additions

No new tables needed - we aggregate existing data. Optional enhancement:

```sql
-- Analytics cache for expensive aggregations (optional optimization)
CREATE TABLE IF NOT EXISTS analytics_cache (
    id VARCHAR(50) PRIMARY KEY,
    data JSONB,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inquiry classifications for learning (optional)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS ai_category VARCHAR(50);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(20);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS ai_urgency VARCHAR(20);
```

## File Structure Additions

```
server/src/
├── routes/
│   └── analytics.js          # NEW - data aggregation endpoints
├── services/ai/
│   ├── analyticsEngine.js    # NEW - shared AI functions
│   ├── inquiryAnalyzer.js     # NEW - inquiry intelligence
│   ├── reportGenerator.js     # NEW - automated reports
│   └── nlQueryTranslator.js   # NEW - NL to query translation

client/src/
├── components/
│   ├── AIAnalyticsChat.jsx    # NEW - natural language query UI
│   ├── InquiryIntelligence.jsx  # NEW - inquiry analysis display
│   └── AIBadge.jsx           # NEW - reusable AI insight badge
├── pages/admin/
│   ├── AnalyticsPage.jsx     # NEW - full analytics dashboard
│   └── (extend) DashboardPage.jsx
```

## Implementation Sequence

1. **Phase 1: Foundation**
   - Create analytics data aggregation endpoints
   - Create shared AI analytics engine
   - Test with simple prompts

2. **Phase 2: Inquiry Intelligence**
   - Extend replySuggester → inquiryAnalyzer
   - Add classification/sentiment to inquiry list
   - Frontend: AI badges on inquiries

3. **Phase 3: Natural Language Query**
   - Create AIAnalyticsChat component
   - Connect to analytics data endpoints
   - Test various query types

4. **Phase 4: Room Insights**
   - Create room insights endpoint
   - Frontend: insight badges on room cards
   - Modal with detailed recommendations

5. **Phase 5: Automated Reports**
   - Create report generation endpoint
   - Add "AI Summary" toggle to dashboard
   - Weekly digest email option

## Cost Considerations

All AI features use existing Gemini API:

- Analytics queries: ~500-1000 tokens each
- Batch processing: Rate limited to prevent runaway costs
- Caching: Analytics results cached for 5-15 minutes
- User-initiated only: No background AI processing
