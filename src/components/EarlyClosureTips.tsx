import type { EarlyClosureTip } from '../utils/loanCalculations';
import { Icon } from './common/Icon';

interface EarlyClosureTipsProps {
  tips: EarlyClosureTip[];
}

const EarlyClosureTips = ({ tips }: EarlyClosureTipsProps) => {
  if (tips.length === 0) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-brand-pink bg-opacity-10 border-brand-pink border-opacity-30';
      case 'medium':
        return 'bg-brand-yellow bg-opacity-20 border-brand-yellow border-opacity-40';
      case 'low':
        return 'bg-brand-purple bg-opacity-10 border-brand-purple border-opacity-30';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Icon name="Zap" size={16} className="text-gray-900" />
        Smart Ways to Close Earlier
      </h4>
      <div className="space-y-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className={`${getPriorityColor(tip.priority)} border rounded-lg p-3 slide-up`}
          >
            <p className="text-sm font-medium text-gray-900 mb-1">{tip.title}</p>
            <p className="text-xs text-gray-700 mb-1">{tip.description}</p>
            <p className="text-xs font-medium text-gray-900">{tip.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarlyClosureTips;

