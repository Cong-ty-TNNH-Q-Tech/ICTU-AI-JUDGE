import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useChallengeDetailVM, useLeaderboardVM } from '../../viewmodels/useChallengeVM';
import { useSubmissionVM } from '../../viewmodels/useSubmissionVM';
import { useToastStore } from '../../store/toastStore';

import ChallengeTimer from '../components/ChallengeTimer';
import SubmitFileZone from '../components/SubmitFileZone';
import SubmitSourceCodeZone from '../components/SubmitSourceCodeZone';
import SubmissionHistoryTable from '../components/SubmissionHistoryTable';
import { SolutionsTab } from '../components/Challenge/SolutionsTab';
import { ContestLeaderboardTab } from '../components/Challenge/ContestLeaderboardTab';

import RulesIllustration from '../../assets/competition-rules.png';

type Tab = 'description' | 'leaderboard' | 'contest_leaderboard' | 'submit' | 'source_code' | 'history' | 'solutions';

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('description');

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
    sourceCodeUploading,
    sourceCodeError,
    sourceCodeSuccess,
    sourceCodeProgress,
    toggleSelectForPrivate,
    clearSubmitMessages,
    uploadSourceCode,
    clearSourceCodeMessages
  } = useSubmissionVM(id || '');

  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const newTeamId = await enroll();
      useToastStore.getState().showToast('Ghi danh thành công!', 'success');
      setTimeout(() => {
        if (newTeamId) navigate(`/teams/${newTeamId}`);
      }, 500);
    } catch (e) {
      useToastStore.getState().showToast(e instanceof Error ? e.message : 'Lỗi ghi danh', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const tabs = [
    { id: 'description' as Tab, label: 'Tổng quan' },
    { id: 'leaderboard' as Tab, label: 'Bảng xếp hạng' },
    { id: 'contest_leaderboard' as Tab, label: 'BXH Tổng' },
    { id: 'submit' as Tab, label: 'Nộp bài' },
    { id: 'source_code' as Tab, label: 'Nộp Source Code' },
    { id: 'history' as Tab, label: 'Lịch sử' },
    { id: 'solutions' as Tab, label: 'Giải pháp' },
  ];

  if (detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tải thông tin cuộc thi...</p>
      </div>
    );
  }

  if (detailError || !challenge) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{detailError || 'Không tìm thấy cuộc thi'}</h3>
        <Link to="/challenges" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const getStatusStyle = () => {
    if (challenge.status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (challenge.status === 'DRAFT') return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400';
    return 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400';
  };

  return (
    <div className="w-full pb-20 animate-fade-in">
      {/* ===== BREADCRUMB ===== */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link to="/challenges" className="text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
          Competitions
        </Link>
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-xs">{challenge.title}</span>
      </nav>

      {/* ===== HERO HEADER ===== */}
      <div className="bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="px-8 pt-8 pb-8 lg:px-10">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset ${
              challenge.type === 'PUBLIC'
                ? 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-500/10 dark:text-primary-400'
                : 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400'
            }`}>
              {challenge.type === 'PUBLIC' ? 'PRACTICE' : 'COMPETITION'}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset ${getStatusStyle()}`}>
              {challenge.status}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-[36px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
            {challenge.title}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-6 text-sm mb-7">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Metric: <strong className="text-slate-800 dark:text-white font-semibold">{challenge.metric_name}</strong>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Đội: <strong className="text-slate-800 dark:text-white font-semibold">tối đa {challenge.max_team_size} người</strong>
            </div>
            <ChallengeTimer endTime={challenge.end_time} variant="compact" className="text-sm font-semibold text-primary-600 dark:text-primary-400" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-7 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-semibold text-sm transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60 shadow-sm hover:shadow-md"
              >
                {enrolling ? 'Đang xử lý...' : 'Tham gia cuộc thi'}
              </button>
            ) : (
              <Link
                to={`/teams/${teamId}`}
                className="px-7 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary/10 dark:text-primary-400 dark:hover:bg-primary/20 rounded-full font-semibold text-sm transition-colors"
              >
                Đội của bạn
              </Link>
            )}

            {challenge.dataset_url && (
              <a
                href={challenge.dataset_url}
                target="_blank"
                rel="noreferrer"
                className="px-7 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-transparent dark:hover:bg-white/5 dark:border-slate-700 dark:text-slate-300 rounded-full font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Tải dữ liệu
              </a>
            )}
          </div>
        </div>

        {/* Gradient bar */}
        <div className="h-0.5 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-600" />
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div className="sticky top-14 z-40 -mx-6 px-6 bg-background/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-sm font-medium transition-all duration-200 rounded-t-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="min-h-[400px]">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'description' && (
          <div className="prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl p-8 lg:p-10 shadow-sm prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-pre:bg-slate-900 prose-pre:text-slate-200">
            {challenge.description ? (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{challenge.description}</ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <img src={RulesIllustration} alt="Rules" className="w-36 h-36 object-contain mb-6 opacity-80" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa có mô tả chi tiết</h3>
                <p className="text-slate-500 text-sm">Mô tả cuộc thi sẽ sớm được cập nhật.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 lg:px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {leaderboardType === 'public' ? 'Bảng xếp hạng Public' : 'Bảng xếp hạng Private'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{totalCount} đội tham gia</p>
                </div>
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setLeaderboardType('public')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      leaderboardType === 'public' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setLeaderboardType('private')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      leaderboardType === 'private' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            {lbError ? (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">{lbError}</p>
              </div>
            ) : lbLoading ? (
              <div className="text-center py-16 text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin mb-4" />
                <p className="font-medium">Đang tải bảng xếp hạng...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Chưa có đội nào nộp bài</h4>
                <p className="text-sm text-slate-500">Hãy là đội đầu tiên ghi danh trên bảng xếp hạng!</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                        <th className="py-3.5 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-16">#</th>
                        <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Đội</th>
                        <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Lượt nộp</th>
                        <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Điểm</th>
                        <th className="py-3.5 px-6 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Nộp lần cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {entries.map((entry) => {
                        const score = leaderboardType === 'public' ? entry.best_public_score : entry.best_private_score;
                        const rankBg = entry.rank === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                          : entry.rank === 2 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          : entry.rank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' : '';

                        return (
                          <tr key={entry.team_id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors">
                            <td className="py-3.5 px-6 w-16">
                              {entry.rank <= 3 ? (
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${rankBg}`}>
                                  {entry.rank}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm pl-1.5">{entry.rank}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">{entry.team_name}</td>
                            <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 text-sm tabular-nums">{entry.entries}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                              {score !== null && score !== undefined ? score.toFixed(4) : '—'}
                            </td>
                            <td className="py-3.5 px-6 text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums">
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
                  <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-transparent">
                    <span className="text-xs text-slate-500">
                      Hiển thị <strong className="text-slate-700 dark:text-slate-300">{(page - 1) * size + 1}–{Math.min(page * size, totalCount)}</strong> / <strong className="text-slate-700 dark:text-slate-300">{totalCount}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors text-slate-600 dark:text-slate-300 shadow-sm"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * size >= totalCount}
                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold transition-colors text-slate-600 dark:text-slate-300 shadow-sm"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2.5: CONTEST LEADERBOARD */}
        {activeTab === 'contest_leaderboard' && (
          <ContestLeaderboardTab challengeId={challenge.id} />
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

        {/* TAB 3.5: SUBMIT SOURCE CODE */}
        {activeTab === 'source_code' && (
          !challenge.end_time ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.25h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Không hỗ trợ nộp Source Code</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Cuộc thi này không giới hạn thời gian nên không yêu cầu nộp Source Code (Anti-Cheat).
              </p>
            </div>
          ) : new Date() < new Date(challenge.end_time) ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-surface-dark border border-surface-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa đến thời gian nộp Source Code</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Chức năng nộp Source Code chỉ được mở sau khi cuộc thi kết thúc vào lúc {new Date(challenge.end_time).toLocaleString('vi-VN')}.
              </p>
            </div>
          ) : (
            <SubmitSourceCodeZone
              maxFileSizeMb={50}
              submitting={sourceCodeUploading}
              uploadProgress={sourceCodeProgress}
              submitError={sourceCodeError}
              submitSuccess={sourceCodeSuccess}
              submissions={submissions}
              onSubmit={uploadSourceCode}
              onClearErrors={clearSourceCodeMessages}
            />
          )
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
    </div>
  );
};

export default ChallengeDetailPage;
