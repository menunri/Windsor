import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Lightbulb, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function AIReportCard() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/analytics/report', {
        reportType: 'dashboard',
        period: '30d'
      });

      if (response.data.success) {
        setReport(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Report fetch error:', err);
      setError(err.message || 'Failed to generate AI report');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRefresh = () => fetchReport(true);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-neutral-900">AI Summary</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-neutral-900">AI Summary</h3>
          </div>
          <button
            onClick={handleRefresh}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">AI Summary</h3>
            <p className="text-xs text-neutral-500">Last updated: {new Date(report.generatedAt).toLocaleTimeString()}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary */}
      <p className="text-neutral-700 text-sm mb-4">{report.summary}</p>

      {/* Highlights */}
      {report.highlights && report.highlights.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Key Metrics
          </h4>
          <div className="space-y-2">
            {report.highlights.slice(0, 4).map((highlight, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                <span className="text-sm text-neutral-700">{highlight.metric}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-neutral-900">{highlight.value}</span>
                  {highlight.change && (
                    <span className="text-xs text-green-600 ml-2">{highlight.change}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {report.anomalies && report.anomalies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Anomalies
          </h4>
          <div className="space-y-1">
            {report.anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`text-sm px-3 py-2 rounded-lg ${
                  anomaly.severity === 'high' ? 'bg-red-50 text-red-700' :
                  anomaly.severity === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-neutral-50 text-neutral-700'
                }`}
              >
                {anomaly.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-primary-500" /> Recommendations
          </h4>
          <div className="space-y-1">
            {report.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-sm text-neutral-700 flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>{rec.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
