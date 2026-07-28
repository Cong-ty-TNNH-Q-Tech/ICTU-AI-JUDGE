import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChallengeDetailVM, useLeaderboardVM } from '../../viewmodels/useChallengeVM';
import { useSubmissionVM } from '../../viewmodels/useSubmissionVM';
import { useToast } from '../components/Toast';

import ChallengeTimer from '../components/ChallengeTimer';
import MetricBadge from '../components/MetricBadge';
import SubmitFileZone from '../components/SubmitFileZone';
import SubmissionHistoryTable from '../components/SubmissionHistoryTable';
import { SolutionsTab } from '../components/Challenge/SolutionsTab';

type Tab = 'description' | 'leaderboard' | 'submit' | 'history' | 'solutions';

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const { showToast, ToastContainer } = useToast();

  const { challenge, loading: detailLoading, error: detailError, isEnrolled, teamId, enroll } = useChallengeDetailVM(id || '');
  const { entries, loading: lbLoading, error: lbError, leaderboardType, setLeaderboardType, page, setPage, totalCount, size } = useLeaderboardVM(id || '');
  const { 
    submissions, 
    loading: subLoading,
    error: subError,
    submitFile, 
    submitting, 
    submitError, 
    submitSuccess,
    uploadProgress,
    rateLimitCountdown,
    togglingPrivateId,
    isPolling,
    toggleSelectForPrivate,
    clearSubmitMessages
  } = useSubmissionVM(id || '');

  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const newTeamId = await enroll();
      showToast('Ghi danh thành công!', 'success');
      setTimeout(() => {
        if (newTeamId) navigate(`/teams/${newTeamId}`);
      }, 500);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi ghi danh', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (detailError || !challenge) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center text-red-500 dark:text-red-400">
        <p>{detailError || 'Không tìm thấy bài thi'}</p>
        <Link to="/challenges" className="mt-4 inline-block px-4 py-2 bg-surface-100 dark:bg-surface-dark rounded-lg text-content-primary dark:text-white">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/challenges" className="text-content-tertiary hover:text-content-primary transition-colors flex items-center gap-2 text-sm font-medium">
          Competitions
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-content-secondary">{challenge.title}</span>
        </Link>
      </div>

      {/* Hero Header - Redesigned to match the provided image */}
      <div className="bg-white dark:bg-surface-dark border-b border-surface-200 dark:border-slate-800 pb-8 pt-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-8 justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md ${
                challenge.type === 'PUBLIC' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
              }`}>
                {challenge.type === 'PUBLIC' ? 'PRACTICE' : 'COMPETITION'}
              </span>
              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest rounded-md ${
                challenge.status === 'PUBLISHED' ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400'
              }`}>
                {challenge.status}
              </span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">
              {challenge.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
              <span className="text-content-secondary">
                Metric: <strong className="text-content-primary dark:text-white">{challenge.metric_name}</strong>
              </span>
              <span className="text-content-secondary">
                Team size: <strong className="text-content-primary dark:text-white">{challenge.max_team_size}</strong>
              </span>
              <span className="font-medium">
                <ChallengeTimer endTime={challenge.end_time} variant="compact" className="text-sm text-primary-600 dark:text-primary-400" />
              </span>
            </div>

            <div className="flex flex-wrap gap-4">
              {!isEnrolled ? (
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary dark:hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 text-sm shadow-sm"
                >
                  {enrolling ? 'Đang xử lý...' : 'Join Competition'}
                </button>
              ) : (
                <Link 
                  to={`/teams/${teamId}`}
                  className="px-6 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary/10 dark:text-primary-400 dark:hover:bg-primary/20 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  Đội của bạn
                </Link>
              )}

              {challenge.dataset_url && (
                <a 
                  href={challenge.dataset_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-transparent dark:hover:bg-white/5 dark:border-white/10 dark:text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Data
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-slate-800 mb-8 sticky top-16 bg-white/90 dark:bg-bg-dark/90 backdrop-blur-md z-40">
        {[
          { id: 'description', label: 'Overview' },
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'submit', label: 'Submit' },
          { id: 'history', label: 'Submissions' },
          { id: 'solutions', label: 'Solutions' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-6 py-3 font-medium text-sm transition-all relative ${
              activeTab === tab.id 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500 dark:border-primary-400' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'description' && (
          <div className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
            {challenge.description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{challenge.description}</ReactMarkdown>
            ) : (
              <p className="text-slate-500 italic">Không có mô tả chi tiết.</p>
            )}
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-surface-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {leaderboardType === 'public' ? 'Public Leaderboard' : 'Private Leaderboard'}
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">{totalCount} teams</span>
                <div className="bg-slate-100 dark:bg-bg-dark p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex">
                  <button
                    onClick={() => setLeaderboardType('public')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      leaderboardType === 'public' ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setLeaderboardType('private')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      leaderboardType === 'private' ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>

            {lbError ? (
              <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {lbError}
              </div>
            ) : lbLoading ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                Đang tải bảng xếp hạng...
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                Chưa có đội nào nộp bài trên bảng xếp hạng này.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4 font-semibold">#</th>
                        <th className="py-3 px-4 font-semibold">TEAM</th>
                        <th className="py-3 px-4 font-semibold text-center">ENTRIES</th>
                        <th className="py-3 px-4 font-semibold text-right">SCORE</th>
                        <th className="py-3 px-4 font-semibold text-right">LAST SUBMIT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => {
                        const score = leaderboardType === 'public' ? entry.best_public_score : entry.best_private_score;
                        return (
                          <tr key={entry.team_id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="py-3 px-4 w-16">
                              {entry.rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-500 font-bold text-xs">1</span>
                              ) : entry.rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold text-xs">2</span>
                              ) : entry.rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400 font-bold text-xs">3</span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-medium text-sm pl-1">{entry.rank}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{entry.team_name}</td>
                            <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 text-sm">{entry.entries}</td>
                            <td className="py-3 px-4 text-right font-bold text-primary-600 dark:text-primary-400">
                              {score !== null && score !== undefined ? score.toFixed(4) : '-'}
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-slate-500 dark:text-slate-400">
                              {new Date(entry.last_submission_time).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="flex justify-between items-center mt-2 px-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="text-xs text-slate-500">
                      Hiển thị <strong className="text-slate-700 dark:text-slate-300">{(page - 1) * size + 1} - {Math.min(page * size, totalCount)}</strong> trên tổng số <strong className="text-slate-700 dark:text-slate-300">{totalCount}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors text-slate-600 dark:text-slate-300"
                      >
                        Trước
                      </button>
                      <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * size >= totalCount}
                        className="px-3 py-1.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors text-slate-600 dark:text-slate-300"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBMIT */}
        {activeTab === 'submit' && (
          <SubmitFileZone 
            maxFileSizeMb={challenge.max_file_size_mb || 50}
            rateLimitCountdown={rateLimitCountdown}
            submitting={submitting}
            uploadProgress={uploadProgress}
            submitError={submitError}
            submitSuccess={submitSuccess}
            onSubmit={submitFile}
            onClearErrors={clearSubmitMessages}
          />
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <SubmissionHistoryTable 
            submissions={submissions}
            loading={subLoading}
            error={subError}
            isPolling={isPolling}
            togglingPrivateId={togglingPrivateId}
            onTogglePrivate={toggleSelectForPrivate}
          />
        )}

        {/* TAB 5: SOLUTIONS */}
        {activeTab === 'solutions' && (
          <SolutionsTab challengeId={challenge.id} />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ChallengeDetailPage;
