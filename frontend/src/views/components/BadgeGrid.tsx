/**
 * BadgeGrid — Component hiển thị hệ thống badges theo phong cách Kaggle.
 * Mỗi badge là một ảnh hexagonal thực tế, earned thì sáng, chưa đạt thì xám.
 * Tuân thủ MVVM: Component chỉ render UI, logic tính toán ở badges.ts.
 */
import React, { useState } from 'react';
import { computeUserBadges, countEarnedBadges, BADGE_DEFINITIONS } from '../../utils/badges';
import type { BadgeResult, BadgeStats } from '../../utils/badges';

interface BadgeGridProps {
  stats: BadgeStats;
  isOwner: boolean;
}

/**
 * Individual Badge — renders hexagonal image with tooltip.
 * Earned badges are full-color, unearned are greyscale.
 */
const BadgeItem: React.FC<{ badge: BadgeResult }> = ({ badge }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Badge Image */}
      <div
        className={`w-[60px] h-[60px] lg:w-[68px] lg:h-[68px] relative transition-all duration-300 ${
          badge.earned
            ? 'cursor-pointer hover:scale-110 hover:-translate-y-1'
            : 'cursor-default'
        }`}
      >
        <img
          src={badge.image}
          alt={badge.name}
          className={`w-full h-full object-contain select-none pointer-events-none transition-all duration-300 ${
            badge.earned
              ? 'drop-shadow-md'
              : 'grayscale opacity-40'
          }`}
          draggable={false}
        />
        {/* Earned glow effect */}
        {badge.earned && (
          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-full pointer-events-none" />
        )}
      </div>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 z-50 pointer-events-none animate-fade-in">
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-xl px-4 py-3 shadow-2xl border border-slate-700/50">
            {/* Badge name + earned status */}
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">{badge.name}</p>
              {badge.earned && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Đã đạt
                </span>
              )}
            </div>
            {/* Description */}
            <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{badge.description}</p>
            {/* Requirement */}
            {!badge.earned && (
              <div className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-2 py-1 rounded-md">
                Yêu cầu: {badge.requirement}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-1.5" />
        </div>
      )}
    </div>
  );
};

/**
 * Main Badge Grid — Kaggle-style layout with wrap.
 */
const BadgeGrid: React.FC<BadgeGridProps> = ({ stats, isOwner }) => {
  const badges = computeUserBadges(stats);
  const earnedCount = countEarnedBadges(stats);
  const totalCount = BADGE_DEFINITIONS.length;

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm p-6 lg:p-8">
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Badges</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isOwner ? (
              earnedCount === totalCount
                ? 'Tuyệt vời! Bạn đã thu thập tất cả badges! 🎉'
                : `Bạn đã đạt ${earnedCount} trong số ${totalCount} Badges. Tiếp tục cố gắng!`
            ) : (
              `Đã đạt ${earnedCount} trong số ${totalCount} Badges.`
            )}
          </p>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0 mt-1">
          <div className="w-28 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(earnedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
            {earnedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Badge grid — wrap layout like Kaggle */}
      <div className="flex flex-wrap gap-3 lg:gap-4">
        {badges.map((badge) => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
};

export default BadgeGrid;
