import React from 'react';
import { Link } from 'react-router-dom';
import type { Challenge } from '../../models/api.types';
import MetricBadge from './MetricBadge';
import ChallengeTimer from './ChallengeTimer';

interface ChallengeCardProps {
  challenge: Challenge;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge }) => {
  const isPublic = challenge.type === 'PUBLIC';
  const isPublished = challenge.status === 'PUBLISHED';

  return (
    <Link 
      to={`/challenges/${challenge.id}`}
      className="block group relative bg-surface-dark border border-slate-800 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
              isPublic ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
            }`}>
              {challenge.type}
            </span>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
              isPublished ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              {challenge.status}
            </span>
          </div>
          <MetricBadge metricName={challenge.metric_name} direction={challenge.metric_direction} />
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {challenge.title}
        </h3>
        
        <p className="text-sm text-slate-400 line-clamp-2 mb-6 min-h-[2.5rem]">
          {challenge.description || 'Không có mô tả'}
        </p>

        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
          <ChallengeTimer endTime={challenge.end_time} variant="compact" />
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            N/A
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChallengeCard;
