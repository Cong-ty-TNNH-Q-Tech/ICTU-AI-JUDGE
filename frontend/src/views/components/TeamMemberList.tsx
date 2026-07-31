import React from 'react';
import type { TeamDetailVM } from '../../models/api.types';
import { useAuthStore } from '../../store';

interface Props {
  team: TeamDetailVM;
  onKick?: (userId: string, userName: string) => void;
}

const TeamMemberList: React.FC<Props> = ({ team, onKick }) => {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-3">
      {team.members.map((member) => {
        const isLeader = member.user_id === team.leader_id;
        const isMe = user?.id === member.user_id;

        // Get initials
        const initials = member.full_name
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || '?';

        return (
          <div
            key={member.user_id}
            className="flex items-center gap-3 p-3 rounded-xl 
              bg-white dark:bg-slate-800/50 
              border border-gray-100 dark:border-slate-700/50
              hover:bg-gray-50 dark:hover:bg-slate-800 
              transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {member.full_name}
                </p>
                {isMe && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                    Bạn
                  </span>
                )}
                {isLeader && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                    👑 Trưởng nhóm
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                {member.email}
              </p>
            </div>

            {/* Nút kick member */}
            {user?.id === team.leader_id && !isMe && !team.has_submissions && onKick && (
               <button 
                 onClick={() => onKick(member.user_id, member.full_name)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
               >
                 Đá ra
               </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TeamMemberList;
