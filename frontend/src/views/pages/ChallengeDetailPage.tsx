import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChallengeDetailVM, useLeaderboardVM, useSubmissionsVM } from '../../viewmodels/useChallengeVM';
import { useAuthStore } from '../../store';
import ChallengeTimer from '../components/ChallengeTimer';
import MetricBadge from '../components/MetricBadge';

type Tab = 'description' | 'leaderboard' | 'submit' | 'history';

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('description');
  
  const { user } = useAuthStore();
  const { challenge, loading: detailLoading, error: detailError, enroll } = useChallengeDetailVM(id || '');
  const { entries, loading: lbLoading, leaderboardType, setLeaderboardType } = useLeaderboardVM(id || '');
  const { submissions, loading: subLoading, submitFile, submitting, submitError, submitSuccess } = useSubmissionsVM(id || '');

  const [enrolling, setEnrolling] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enroll();
      alert('Ghi danh thành công!');
    } catch (e: any) {
      alert(e.message || 'Lỗi ghi danh');
    } finally {
      setEnrolling(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      await submitFile(selectedFile);
      setSelectedFile(null); // clear after success
    } catch (e) {
      // Error handled by VM
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
                    {entries.map((entry, idx) => (
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
          <div className="max-w-2xl mx-auto">
            {submitSuccess && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {submitSuccess}
              </div>
            )}
            
            {submitError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {submitError}
              </div>
            )}

            <div className="bg-surface-dark border border-slate-800 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-6">Nộp kết quả dự đoán</h3>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'
                }`}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                onDrop={handleDrop}
              >
                {!selectedFile ? (
                  <>
                    <svg className="w-12 h-12 text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-slate-300 font-medium mb-1">Kéo thả file .csv vào đây</p>
                    <p className="text-slate-500 text-sm mb-4">hoặc</p>
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Chọn file
                      <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                    </label>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-white font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-slate-500 text-sm mb-4">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-300 text-sm font-medium">Hủy bỏ</button>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || submitting}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  Gửi bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LỊCH SỬ NỘP */}
        {activeTab === 'history' && (
          <div className="bg-surface-dark border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Lịch sử nộp bài</h3>
            
            {subLoading ? (
              <div className="text-center py-12 text-slate-400">Đang tải lịch sử...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Chưa có bài nộp nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-4 font-medium">Thời gian</th>
                      <th className="py-4 px-4 font-medium">Trạng thái</th>
                      <th className="py-4 px-4 font-medium text-right">Điểm Public</th>
                      <th className="py-4 px-4 font-medium text-center">Tính Private</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-sm text-slate-300">
                          {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            sub.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            sub.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {sub.status === 'PROCESSING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-ring"></span>}
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-white">
                          {sub.public_score !== null ? sub.public_score.toFixed(4) : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {sub.is_selected_for_private ? (
                            <span className="text-green-400 text-lg">✓</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ChallengeDetailPage;
