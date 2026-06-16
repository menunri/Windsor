import { useState } from 'react';
import { Send, Bot, Loader2, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const SUGGESTED_QUESTIONS = [
  'How many inquiries did we get this month?',
  'What is our current occupancy rate?',
  'Which room got the most inquiries?',
  'What is our average response rate?',
  'Show me revenue trends',
  'Any anomalies I should know about?'
];

export default function AIAnalyticsChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (question = input) => {
    if (!question.trim() || isLoading) return;

    const userMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/analytics/query', { question });
      
      if (response.data.success) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.data.answer,
          suggestedFollowUps: response.data.data.suggestedFollowUps
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Analytics query error:', err);
      setError(err.message || 'Failed to process query. Please try again.');
      setMessages(prev => prev.filter(m => m !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSend(question);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-neutral-900">AI Analytics Assistant</h3>
            <p className="text-sm text-neutral-500">Ask questions about your data</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="border-t border-neutral-200">
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">
                  Ask me anything about your Windsor analytics!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="bg-primary-100 p-2 rounded-lg h-fit">
                      <Bot className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>

                {/* Suggested follow-ups for AI responses */}
                {message.role === 'assistant' && message.suggestedFollowUps && (
                  <div className="ml-8 space-y-1">
                    <p className="text-xs text-neutral-400">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestedFollowUps.slice(0, 3).map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestedQuestion(q)}
                          className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-full"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-primary-100 p-2 rounded-lg h-fit">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-neutral-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-neutral-400 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2 pb-4">
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs text-neutral-600 hover:text-primary-600 bg-neutral-100 hover:bg-primary-50 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-neutral-200 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your analytics..."
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
