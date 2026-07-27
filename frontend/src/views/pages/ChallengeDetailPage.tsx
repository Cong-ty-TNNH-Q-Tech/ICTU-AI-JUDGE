import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChallengeDetailVM } from '../../viewmodels/useChallengeVM';
import type { Challenge } from '../../models/api.types';

const MOCK: Challenge = {
  id: '1', title: 'Titanic — Machine Learning from Disaster',
  description: `## Overview\n\nThe sinking of the Titanic is one of the most infamous shipwrecks in history. On April 15, 1912, during her maiden voyage, the widely considered "unsinkable" RMS Titanic sank after colliding with an iceberg.\n\nIn this challenge, you will build a predictive model that answers the question: **"What sorts of people were more likely to survive?"** using passenger data such as name, age, gender, and socio-economic class.\n\n## Data Description\n\n- **train.csv** — Training set (891 samples)\n- **test.csv** — Test set (418 samples)\n- **sample_submission.csv** — Submission format\n\n## Evaluation\n\nSubmissions are evaluated on **Accuracy** — the percentage of passengers correctly predicted.`,
  type: 'PUBLIC', status: 'PUBLISHED', is_public: true,
  start_time: '2026-07-01T00:00:00Z', end_time: '2026-08-31T23:59:59Z',
  rate_limit_minutes: 10, max_file_size_mb: 50, max_team_size: 4,
  metric_name: 'Accuracy', metric_direction: 'HIGHER_IS_BETTER',
  dataset_url: 'https://drive.google.com/drive/folders/example',
};

const LEADERBOARD = [
  { rank: 1, team: 'Team Alpha', score: 0.9856, time: '2026-07-25T10:30:00Z' },
  { rank: 2, team: 'AI Warriors', score: 0.9821, time: '2026-07-25T09:15:00Z' },
  { rank: 3, team: 'DeepLearners', score: 0.9789, time: '2026-07-24T22:45:00Z' },
  { rank: 4, team: 'Team Cuong', score: 0.9734, time: '2026-07-24T18:00:00Z' },
  { rank: 5, team: 'ICTU Stars', score: 0.9698, time: '2026-07-24T14:30:00Z' },
  { rank: 6, team: 'Neural Nets', score: 0.9650, time: '2026-07-23T20:00:00Z' },
  { rank: 7, team: 'Data Miners', score: 0.9612, time: '2026-07-23T16:45:00Z' },
  { rank: 8, team: 'Gradient Squad', score: 0.9580, time: '2026-07-22T11:30:00Z' },
];

type Tab = 'overview' | 'data' | 'leaderboard' | 'submissions';

const ChallengeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { challenge: api } = useChallengeDetailVM(id || '');
  const [tab, setTab] = useState<Tab>('overview');
  const challenge = api || MOCK;

  const diff = new Date(challenge.end_time).getTime() - Date.now();
  const days = Math.max(0, Math.floor(diff / 864e5));
  const hours = Math.max(0, Math.floor((diff % 864e5) / 36e5));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'data', label: 'Data & Rules' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'submissions', label: 'Submit' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-content-tertiary mb-5">
        <Link to="/challenges" className="hover:text-primary-500 transition-colors">Competitions</Link>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-content-primary dark:text-content-dark-primary font-medium truncate max-w-sm">{challenge.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className={`badge ${challenge.type === 'COMPETITION' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'badge-primary'}`}>
            {challenge.type === 'COMPETITION' ? 'Featured Competition' : 'Practice'}
          </span>
          <span className="badge badge-success">{challenge.status}</span>
        </div>
        <h1 className="text-[32px] font-bold text-content-primary dark:text-content-dark-primary tracking-tight leading-tight mb-3">
          {challenge.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-content-secondary dark:text-content-dark-secondary">
          <span>Metric: <strong className="text-content-primary dark:text-content-dark-primary">{challenge.metric_name}</strong></span>
          <span>Team size: <strong className="text-content-primary dark:text-content-dark-primary">{challenge.max_team_size}</strong></span>
          <span className={diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
            {diff > 0 ? `${days}d ${hours}h remaining` : 'Competition ended'}
          </span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 mb-8">
        <button className="btn-primary">Join Competition</button>
        {challenge.dataset_url && (
          <a href={challenge.dataset_url} target="_blank" rel="noopener noreferrer" className="btn-ghost border border-surface-200 dark:border-gray-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Download Data
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-surface-200 dark:border-gray-800 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`tab-btn ${tab === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={tab} className="animate-fade-in">
        {tab === 'overview' && (
          <div className="card p-6 lg:p-8 max-w-4xl">
            {(challenge.description || '').split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-content-primary dark:text-content-dark-primary mt-8 mb-3 first:mt-0">{line.replace('## ', '')}</h2>;
              if (line.startsWith('- **')) return <li key={i} className="text-[14px] text-content-secondary dark:text-content-dark-secondary ml-4 mb-1">{line.replace('- ', '')}</li>;
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return <p key={i} className="text-[14px] text-content-secondary dark:text-content-dark-secondary leading-relaxed mb-1.5">{line}</p>;
            })}
          </div>
        )}

        {tab === 'data' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary mb-4">Competition Rules</h3>
              <div className="space-y-3">
                {[
                  ['Evaluation metric', challenge.metric_name],
                  ['Submit cooldown', `${challenge.rate_limit_minutes} min`],
                  ['Max file size', `${challenge.max_file_size_mb} MB`],
                  ['Max team size', `${challenge.max_team_size} members`],
                ].map(([label, val], i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-gray-800 last:border-0">
                    <span className="text-[13px] text-content-tertiary">{label}</span>
                    <span className="text-[13px] font-semibold text-content-primary dark:text-content-dark-primary">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-gray-800">
                  <span className="text-[13px] text-content-tertiary">Start date</span>
                  <span className="text-[13px] font-semibold text-content-primary dark:text-content-dark-primary">{new Date(challenge.start_time).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-content-tertiary">End date</span>
                  <span className="text-[13px] font-semibold text-content-primary dark:text-content-dark-primary">{new Date(challenge.end_time).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="card p-0 overflow-hidden max-w-4xl">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary">Public Leaderboard</h3>
              <span className="text-[12px] text-content-tertiary">{LEADERBOARD.length} teams</span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] text-content-tertiary uppercase tracking-wider bg-surface-50 dark:bg-gray-900/40">
                  <th className="px-5 py-2.5 text-left font-medium w-16">#</th>
                  <th className="px-5 py-2.5 text-left font-medium">Team</th>
                  <th className="px-5 py-2.5 text-right font-medium">Score</th>
                  <th className="px-5 py-2.5 text-right font-medium hidden sm:table-cell">Last submit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
                {LEADERBOARD.map(e => (
                  <tr key={e.rank} className="hover:bg-surface-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      {e.rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold ${
                          e.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          e.rank === 2 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                        }`}>{e.rank}</span>
                      ) : (
                        <span className="text-content-tertiary pl-1">{e.rank}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-content-primary dark:text-content-dark-primary">{e.team}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-primary-600 dark:text-primary-400 tabular-nums">{e.score.toFixed(4)}</td>
                    <td className="px-5 py-3 text-right text-content-tertiary text-[12px] hidden sm:table-cell">{new Date(e.time).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'submissions' && (
          <div className="card p-6 max-w-2xl">
            <h3 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary mb-1">Submit predictions</h3>
            <p className="text-[13px] text-content-tertiary mb-5">Upload your prediction file (.csv) for automatic scoring.</p>
            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-surface-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 bg-surface-50/50 dark:bg-gray-800/20 transition-colors group">
              <svg className="w-8 h-8 mb-2 text-content-tertiary group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary">Drop file here or click to upload</p>
              <p className="text-[11px] text-content-tertiary mt-1">.csv only — max {challenge.max_file_size_mb}MB</p>
              <input type="file" className="hidden" accept=".csv" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetailPage;
