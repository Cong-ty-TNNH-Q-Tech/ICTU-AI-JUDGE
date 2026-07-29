import React, { useState, useEffect } from 'react';
import type { Challenge, ChallengeCreateRequest } from '../../../models/api.types';
import { adminService } from '../../../services/adminService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Props {
  initialData?: Challenge | null;
  onSubmit: (data: ChallengeCreateRequest, groundTruthFile?: File, metricScriptFile?: File, publicTestSplitRatio?: number) => Promise<void>;
  onCancel: () => void;
}

const FileUploadZone = ({ 
  label, 
  accept, 
  required, 
  disabled, 
  file, 
  onChange, 
  hint 
}: { 
  label: string; accept: string; required?: boolean; disabled?: boolean; 
  file: File | null; onChange: (f: File | null) => void; hint?: string 
}) => {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-50 dark:bg-gray-900 border-surface-200 dark:border-gray-800' : 
          file ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500 dark:border-primary-500/50' : 
          'hover:bg-surface-50 dark:hover:bg-gray-800/50 border-surface-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer'}`}
      >
        <input 
          type="file" 
          accept={accept} 
          required={required && !file} 
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {file ? (
          <>
            <svg className="w-8 h-8 text-primary-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-content-primary dark:text-content-dark-primary">{file.name}</p>
            <p className="text-xs text-content-tertiary mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-content-tertiary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-content-secondary dark:text-content-dark-secondary">Click or drag file to upload</p>
            <p className="text-xs text-content-tertiary mt-1">Accepts {accept}</p>
          </>
        )}
      </div>
      {hint && <p className="text-[11px] text-content-tertiary mt-1.5">{hint}</p>}
    </div>
  );
};

const ChallengeForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const isEdit = !!initialData;
  const isLocked = initialData?.status === 'PUBLISHED';
  const [activeTab, setActiveTab] = useState<'general' | 'timeline' | 'evaluation'>('general');

  const [form, setForm] = useState<ChallengeCreateRequest>({
    title: '', description: '', start_time: '', end_time: '',
    type: 'PUBLIC', status: 'DRAFT', dataset_url: '',
    metric_name: 'ACCURACY', metric_direction: 'HIGHER_IS_BETTER',
    max_file_size_mb: 50, rate_limit_minutes: 10, max_team_size: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnlimitedTime, setIsUnlimitedTime] = useState(false);
  
  const [groundTruthFile, setGroundTruthFile] = useState<File | null>(null);
  const [metricScriptFile, setMetricScriptFile] = useState<File | null>(null);
  const [sampleSubmissionFile, setSampleSubmissionFile] = useState<File | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [publicTestSplitRatio, setPublicTestSplitRatio] = useState(30);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title, description: initialData.description || '',
        start_time: initialData.start_time, end_time: initialData.end_time,
        type: initialData.type, status: initialData.status, dataset_url: initialData.dataset_url || '',
        metric_name: initialData.metric_name, metric_direction: initialData.metric_direction,
        max_file_size_mb: initialData.max_file_size_mb, rate_limit_minutes: initialData.rate_limit_minutes,
        max_team_size: initialData.max_team_size,
      });
      setIsUnlimitedTime(initialData.end_time === null);
    }
  }, [initialData]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const handleTestMetric = async () => {
    if (!groundTruthFile || !sampleSubmissionFile) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const formData = new FormData();
      formData.append('ground_truth', groundTruthFile);
      formData.append('submission', sampleSubmissionFile);
      formData.append('metric_name', form.metric_name);
      if (form.metric_name === 'CUSTOM' && metricScriptFile) {
        formData.append('metric_script', metricScriptFile);
      }
      
      const { score } = await adminService.testMetric(formData);
      setTestResult(`Success! Calculated Score: ${score}`);
    } catch (err: unknown) {
      // @ts-expect-error axios response type
      setTestResult(`Error: ${err.response?.data?.detail || (err as Error).message || 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { 
      if (!isEdit && !groundTruthFile) {
        throw new Error('Ground Truth file is required for new competitions');
      }
      if (form.metric_name === 'CUSTOM' && !isEdit && !metricScriptFile) {
        throw new Error('Custom Metric script is required');
      }
      const submitForm = { ...form, end_time: isUnlimitedTime ? null : form.end_time };
      await onSubmit(submitForm, groundTruthFile || undefined, metricScriptFile || undefined, publicTestSplitRatio); 
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setLoading(false); }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-surface dark:bg-surface-dark border border-surface-200 dark:border-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl my-8 animate-scale-in flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-gray-800 flex justify-between items-center bg-surface-50 dark:bg-gray-900 rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg font-semibold text-content-primary dark:text-content-dark-primary">{isEdit ? 'Edit Competition' : 'Create New Competition'}</h2>
          <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-surface-200 dark:hover:bg-gray-800 flex items-center justify-center text-content-tertiary hover:text-content-primary transition-colors text-xl leading-none">&times;</button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[400px]">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-surface-200 dark:border-gray-800 bg-surface-50/50 dark:bg-gray-900/50 p-4 space-y-1 flex-shrink-0 flex md:flex-col overflow-x-auto">
            <button type="button" onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'general' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-content-secondary dark:text-content-dark-secondary hover:bg-surface-100 dark:hover:bg-gray-800'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              General Info
            </button>
            <button type="button" onClick={() => setActiveTab('timeline')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'timeline' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-content-secondary dark:text-content-dark-secondary hover:bg-surface-100 dark:hover:bg-gray-800'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Timeline & Limits
            </button>
            <button type="button" onClick={() => setActiveTab('evaluation')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'evaluation' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-content-secondary dark:text-content-dark-secondary hover:bg-surface-100 dark:hover:bg-gray-800'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Evaluation
            </button>
          </div>

          {/* Form Content */}
          <form id="challenge-form" onSubmit={submit} className="flex-1 p-6 overflow-y-auto">
            {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>}
            
            {isLocked && <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              This competition is published and actively running. Critical fields like metric and ground truth are locked to prevent inconsistencies.
            </div>}

            <div className={activeTab === 'general' ? 'block animate-fade-in' : 'hidden'}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input required type="text" name="title" value={form.title} onChange={set} className="input-field shadow-sm" placeholder="e.g., Titanic Machine Learning from Disaster" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary">Description</label>
                    <button type="button" onClick={() => setPreviewMarkdown(!previewMarkdown)} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md transition-colors">
                      {previewMarkdown ? 'Edit Markdown' : 'Preview Markdown'}
                    </button>
                  </div>
                  {previewMarkdown ? (
                    <div className="input-field min-h-[160px] overflow-y-auto max-h-[300px] prose prose-sm dark:prose-invert bg-surface-50 dark:bg-gray-900">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{form.description || '*No description provided*'}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea name="description" value={form.description} onChange={set} rows={8} className="input-field resize-none font-mono text-[13px] shadow-sm leading-relaxed" placeholder="# Introduction&#10;Describe your challenge here..."></textarea>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Dataset URL</label>
                  <input type="url" name="dataset_url" value={form.dataset_url} onChange={set} className="input-field shadow-sm" placeholder="https://drive.google.com/..." />
                  <p className="text-[11px] text-content-tertiary mt-1.5">Provide a link where participants can download the dataset (Google Drive, Kaggle, etc.)</p>
                </div>
                <div className="grid grid-cols-2 gap-5 p-4 bg-surface-50 dark:bg-gray-900/50 rounded-xl border border-surface-200 dark:border-gray-800">
                  <div>
                    <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Type</label>
                    <select name="type" value={form.type} onChange={set} className="input-field shadow-sm bg-white dark:bg-surface-dark">
                      <option value="PUBLIC">Public (Practice)</option>
                      <option value="COMPETITION">Competition (Ranked)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Status</label>
                    <select name="status" value={form.status} onChange={set} className="input-field shadow-sm bg-white dark:bg-surface-dark">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className={activeTab === 'timeline' ? 'block animate-fade-in' : 'hidden'}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="p-4 bg-surface-50 dark:bg-gray-900/50 rounded-xl border border-surface-200 dark:border-gray-800">
                    <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Start Time <span className="text-red-500">*</span></label>
                    <input required type="datetime-local" name="start_time" value={form.start_time?.substring(0, 16)} onChange={set} className="input-field shadow-sm bg-white dark:bg-surface-dark" />
                  </div>
                  <div className="p-4 bg-surface-50 dark:bg-gray-900/50 rounded-xl border border-surface-200 dark:border-gray-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-0">End Time {!isUnlimitedTime && <span className="text-red-500">*</span>}</label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={isUnlimitedTime} onChange={(e) => setIsUnlimitedTime(e.target.checked)} className="rounded border-surface-300 text-primary-600 shadow-sm focus:ring-primary-500 cursor-pointer" />
                        <span className="text-xs text-content-secondary group-hover:text-primary-600 transition-colors">Không giới hạn</span>
                      </label>
                    </div>
                    {!isUnlimitedTime && (
                      <input required type="datetime-local" name="end_time" value={form.end_time?.substring(0, 16) || ''} onChange={set} className="input-field shadow-sm bg-white dark:bg-surface-dark" />
                    )}
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary border-b border-surface-200 dark:border-gray-800 pb-2 mt-6">Submission Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Max File Size (MB)</label>
                    <input type="number" name="max_file_size_mb" min="1" value={form.max_file_size_mb} onChange={set} className="input-field shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Cooldown (min)</label>
                    <input type="number" name="rate_limit_minutes" min="0" value={form.rate_limit_minutes} onChange={set} className="input-field shadow-sm" />
                    <p className="text-[11px] text-content-tertiary mt-1.5">Time between submissions</p>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Max Team Size</label>
                    <input type="number" name="max_team_size" min="1" value={form.max_team_size} onChange={set} className="input-field shadow-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className={activeTab === 'evaluation' ? 'block animate-fade-in' : 'hidden'}>
              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Evaluation Metric</label>
                  <select name="metric_name" value={form.metric_name} onChange={set} disabled={isLocked} className="input-field shadow-sm disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-gray-900 text-sm py-2.5">
                    <option value="ACCURACY">Accuracy (Higher is better)</option>
                    <option value="F1_SCORE">F1 Score (Higher is better)</option>
                    <option value="RMSE">RMSE - Root Mean Squared Error (Lower is better)</option>
                    <option value="CUSTOM">Custom Script</option>
                  </select>
                </div>

                <div className="pt-2">
                  <FileUploadZone 
                    label="Ground Truth File" 
                    accept=".csv" 
                    required={!isEdit} 
                    disabled={isLocked}
                    file={groundTruthFile} 
                    onChange={setGroundTruthFile}
                    hint={isEdit && !isLocked ? "Upload a new CSV to replace the existing ground truth file." : "Contains the actual labels/values used for scoring submissions."}
                  />
                  {groundTruthFile && (
                    <div className="mt-4 p-4 bg-surface-50 dark:bg-gray-900/50 border border-surface-200 dark:border-gray-800 rounded-xl animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary">
                          Tỷ lệ tập Public Test
                        </label>
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                          {publicTestSplitRatio}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={publicTestSplitRatio}
                        onChange={(e) => setPublicTestSplitRatio(parseInt(e.target.value))}
                        disabled={isLocked}
                        className="w-full h-1.5 bg-surface-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <p className="text-[11px] text-content-tertiary mt-2">
                        Nếu file CSV chưa có cột <b>Usage</b>, hệ thống sẽ tự động gán {publicTestSplitRatio}% số dòng làm tập Public ngẫu nhiên.
                      </p>
                    </div>
                  )}
                </div>

                {form.metric_name === 'CUSTOM' && (
                  <div className="pt-2 animate-fade-in">
                    <FileUploadZone 
                      label="Custom Metric Script" 
                      accept=".py" 
                      required={!isEdit} 
                      disabled={isLocked}
                      file={metricScriptFile} 
                      onChange={setMetricScriptFile}
                      hint={isEdit && !isLocked ? "Upload a new Python script to replace the existing one." : "Python script executed in a secure sandbox to calculate the score."}
                    />
                  </div>
                )}

                {!isLocked && (
                  <div className="pt-4 border-t border-surface-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-content-primary dark:text-content-dark-primary mb-4">Test Evaluation Script</h3>
                    <FileUploadZone 
                      label="Sample Submission File" 
                      accept=".csv" 
                      file={sampleSubmissionFile} 
                      onChange={setSampleSubmissionFile}
                      hint="Upload a sample submission CSV to test against the ground truth."
                    />
                    
                    {testResult && (
                      <div className={`mb-4 p-3 rounded-lg text-sm ${testResult.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30'}`}>
                        {testResult}
                      </div>
                    )}

                    <button 
                      type="button" 
                      onClick={handleTestMetric}
                      disabled={testLoading || !groundTruthFile || !sampleSubmissionFile || (form.metric_name === 'CUSTOM' && !metricScriptFile)}
                      className="relative overflow-hidden group flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 focus:ring-4 focus:ring-primary-500/30 shadow-lg shadow-primary-500/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>
                      {testLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Running Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Run Test Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-surface-200 dark:border-gray-800 flex justify-between items-center bg-surface-50 dark:bg-gray-900 rounded-b-2xl flex-shrink-0">
          <div className="text-sm text-content-secondary dark:text-content-dark-secondary">
            {activeTab !== 'general' && <button type="button" onClick={() => setActiveTab(activeTab === 'evaluation' ? 'timeline' : 'general')} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">&larr; Previous step</button>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="btn-ghost border border-surface-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-sm">Cancel</button>
            {activeTab !== 'evaluation' ? (
              <button type="button" onClick={() => setActiveTab(activeTab === 'general' ? 'timeline' : 'evaluation')} className="btn-primary shadow-sm shadow-primary-500/20">Next step &rarr;</button>
            ) : (
              <button type="submit" form="challenge-form" disabled={loading} className="btn-primary shadow-sm shadow-primary-500/20 min-w-[120px] justify-center">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </span>
                ) : (isEdit ? 'Save Changes' : 'Create Competition')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeForm;
