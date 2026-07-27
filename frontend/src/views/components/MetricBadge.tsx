import React from 'react';
import type { MetricDirection } from '../../models/api.types';

interface MetricBadgeProps {
  metricName: string;
  direction: MetricDirection;
}

const MetricBadge: React.FC<MetricBadgeProps> = ({ metricName, direction }) => {
  const isHigherBetter = direction === 'HIGHER_IS_BETTER';

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300 shadow-sm backdrop-blur-sm">
      <span className="font-semibold">{metricName}</span>
      <span className={isHigherBetter ? 'text-green-400' : 'text-blue-400'}>
        {isHigherBetter ? '↑' : '↓'}
      </span>
    </div>
  );
};

export default MetricBadge;
