import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChallengeDetailVM, useLeaderboardVM } from '../../viewmodels/useChallengeVM';
import { useSubmissionVM } from '../../viewmodels/useSubmissionVM';

import ChallengeTimer from '../components/ChallengeTimer';
import MetricBadge from '../components/MetricBadge';
import SubmitFileZone from '../components/SubmitFileZone';
import SubmissionHistoryTable from '../components/SubmissionHistoryTable';

type Tab = 'description' | 'leaderboard' | 'submit' | 'history';

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('description');
  

  const { challenge, loading: detailLoading, error: detailError, enroll } = useChallengeDetailVM(id || '');
  const { entries, loading: lbLoading, leaderboardType, setLeaderboardType } = useLeaderboardVM(id || '');
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
      await enroll();
      alert('Ghi danh thành công!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi ghi danh');
    } finally {
      setEnrolling(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (detailError || !challenge) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">
        <p>{detailError || 'Không tìm thấy bài thi'}</p>
        <Link to="/challenges" className="mt-4 inline-block px-4 py-2 bg-surface-dark rounded-lg text-white">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/challenges" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Danh sách bài thi
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-surface-dark border border-slate-800 rounded-3xl p-8 lg:p-10 relative overflow-hidden mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                challenge.type === 'PUBLIC' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              }`}>
                {challenge.type}
              </span>
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                challenge.status === 'PUBLISHED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {challenge.status}
              </span>
              <MetricBadge metricName={challenge.metric_name} direction={challenge.metric_direction} />
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
              {challenge.title}
            </h1>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-70"
              >
                {enrolling ? 'Đang xử lý...' : 'Ghi danh ngay'}
              </button>
              {challenge.dataset_url && (
                <a 
                  href={challenge.dataset_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải Dataset
                </a>
              )}
            </div>
          </div>

          <div className="lg:w-auto bg-bg-dark/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm self-start">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Thời gian còn lại</h3>
            <ChallengeTimer endTime={challenge.end_time} variant="full" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-8 sticky top-16 bg-bg-dark/80 backdrop-blur-md z-40">
        {[
          { id: 'description', label: 'Mô tả' },
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'submit', label: 'Nộp bài' },
          { id: 'history', label: 'Lịch sử nộp' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-6 py-4 font-medium text-sm transition-all relative ${
              activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary tab-underline rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: MÔ TẢ */}
        {activeTab === 'description' && (
          <div className="prose prose-invert prose-slate max-w-none bg-surface-dark border border-slate-800 rounded-2xl p-8">
            {challenge.description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{challenge.description}</ReactMarkdown>
            ) : (
              <p className="text-slate-500 italic">Không có mô tả chi tiết.</p>
            )}
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Bảng Xếp Hạng</h3>
              <div className="bg-bg-dark p-1 rounded-lg border border-slate-800 flex">
                <button
                  onClick={() => setLeaderboardType('public')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    leaderboardType === 'public' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Public
                </button>
                <button
                  onClick={() => setLeaderboardType('private')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    leaderboardType === 'private' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Private
                </button>
              </div>
            </div>

            {lbLoading ? (
              <div className="text-center py-12 text-slate-400">Đang tải bảng xếp hạng...</div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Chưa có dữ liệu bảng xếp hạng.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-4 font-medium">Hạng</th>
                      <th className="py-4 px-4 font-medium">Đội thi</th>
                      <th className="py-4 px-4 font-medium text-right">Điểm số</th>
                      <th className="py-4 px-4 font-medium text-right">Lần nộp cuối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.team_id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : <span className="text-slate-400">#{entry.rank}</span>}
                        </td>
                        <td className="py-4 px-4 font-medium text-white">{entry.team_name}</td>
                        <td className="py-4 px-4 text-right font-bold text-primary">
                          {leaderboardType === 'public' ? entry.best_public_score?.toFixed(4) : entry.best_private_score?.toFixed(4)}
                        </td>
                        <td className="py-4 px-4 text-right text-sm text-slate-400">
                          {new Date(entry.last_submission_time).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NỘP BÀI */}
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

        {/* TAB 4: LỊCH SỬ NỘP */}
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

      </div>
    </div>
  );
};

export default ChallengeDetailPage;
