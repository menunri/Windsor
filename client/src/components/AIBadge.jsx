import { Sparkles } from 'lucide-react';

const CATEGORY_COLORS = {
  availability: 'bg-blue-100 text-blue-700',
  pricing: 'bg-green-100 text-green-700',
  amenities: 'bg-purple-100 text-purple-700',
  process: 'bg-amber-100 text-amber-700',
  maintenance: 'bg-red-100 text-red-700',
  general: 'bg-neutral-100 text-neutral-700'
};

const SENTIMENT_COLORS = {
  positive: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  negative: 'bg-red-100 text-red-700',
  urgent: 'bg-red-100 text-red-700'
};

const URGENCY_COLORS = {
  high: 'bg-red-500 text-white',
  medium: 'bg-amber-500 text-white',
  normal: 'bg-primary-100 text-primary-700'
};

export default function AIBadge({ type, value, showIcon = true, size = 'sm' }) {
  const getColors = () => {
    switch (type) {
      case 'category':
        return CATEGORY_COLORS[value] || CATEGORY_COLORS.general;
      case 'sentiment':
        return SENTIMENT_COLORS[value] || SENTIMENT_COLORS.neutral;
      case 'urgency':
        return URGENCY_COLORS[value] || URGENCY_COLORS.normal;
      default:
        return 'bg-primary-100 text-primary-700';
    }
  };

  const getLabel = () => {
    if (!value) return null;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${getColors()} ${sizeClasses[size]}`}
    >
      {showIcon && <Sparkles className="w-3 h-3" />}
      {getLabel()}
    </span>
  );
}
