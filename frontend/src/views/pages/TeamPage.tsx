import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamVM } from '../../viewmodels/useTeamVM';
import TeamMemberList from '../components/TeamMemberList';
import InviteModal from '../components/InviteModal';

const TeamPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const {
    team,
    loading,
    error,
    inviteLoading,
    inviteResult,
    canInvite,
    createInvite,
    kickMember,
    ToastContainer
  } = useTeamVM(teamId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-200 dark:border-slate-700 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-3xl mx-auto pt-10">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-6 rounded-2xl text-center">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Không thể tải thông tin đội</h2>
          <p className="text-red-600 dark:text-red-300/80 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/challenges')}
            className="px-6 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
          >
            Quay lại danh sách bài thi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 animate-fade-in">
      {/* Hero card */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-slate-800 rounded-3xl p-8 mb-8 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full">
                Team
              </span>
              <span className="text-gray-500 dark:text-slate-400 text-sm">
                ID: {team.id.substring(0, 8)}...
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {team.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
               Tham gia bài thi: <span className="font-semibold">{team.challenge_id.substring(0,8)}...</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[160px]">
             {canInvite && (
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                 </svg>
                 Mời thành viên
               </button>
             )}
             <button 
                onClick={() => navigate(`/challenges/${team.challenge_id}`)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700"
              >
                Về trang bài thi
              </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thành viên đội ({team.members.length})</h3>
           </div>
           
           <TeamMemberList team={team} onKick={kickMember} />
        </div>
      </div>

      <InviteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loading={inviteLoading}
        inviteResult={inviteResult}
        onGenerate={createInvite}
      />
      <ToastContainer />
    </div>
  );
};

export default TeamPage;
