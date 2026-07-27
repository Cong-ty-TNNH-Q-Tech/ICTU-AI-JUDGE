import React, { useState } from 'react';
import { challengeService } from '../../../services/challengeService';

interface Props {
  challengeId: string;
  metricName: string;
  onClose: () => void;
}

const UploadSecrets: React.FC<Props> = ({ challengeId, metricName, onClose }) => {
  const [gtFile, setGtFile] = useState<File | null>(null);
  const [metricFile, setMetricFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gtFile) { setError('Ground truth file is required'); return; }
    if (metricName === 'CUSTOM' && !metricFile) { setError('Custom metric script is required'); return; }
    setLoading(true); setError(''); setDone(false);
    try {
      await challengeService.uploadSecrets(challengeId, gtFile, metricFile || undefined);
      setDone(true); setTimeout(onClose, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4 animate-fade-in">
      <div className="bg-surface dark:bg-surface-dark border border-surface-200 dark:border-gray-800 w-full max-w-lg rounded-2xl shadow-elevated animate-scale-in">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-content-primary dark:text-content-dark-primary">Upload Files</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-md hover:bg-surface-100 dark:hover:bg-gray-800 flex items-center justify-center text-content-tertiary hover:text-content-primary transition-colors text-lg leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <p className="text-[13px] text-content-tertiary leading-relaxed">Ground truth files are stored securely and never exposed to participants.</p>
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
          {done && <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[13px]">Upload successful</div>}

          <div>
            <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Ground Truth (.csv) <span className="text-red-500">*</span></label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-surface-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 bg-surface-50/50 dark:bg-gray-800/20 transition-colors">
              <svg className="w-5 h-5 mb-1.5 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
              <p className="text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary">{gtFile ? gtFile.name : 'Choose file'}</p>
              <input type="file" className="hidden" accept=".csv" onChange={e => e.target.files && setGtFile(e.target.files[0])} />
            </label>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">
              Metric Script (.py) {metricName === 'CUSTOM' && <span className="text-red-500">*</span>}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-surface-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 bg-surface-50/50 dark:bg-gray-800/20 transition-colors">
              <p className="text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary">{metricFile ? metricFile.name : 'Choose file'}</p>
              <input type="file" className="hidden" accept=".py" onChange={e => e.target.files && setMetricFile(e.target.files[0])} />
            </label>
            {metricName !== 'CUSTOM' && <p className="text-[11px] text-content-tertiary mt-1.5">Using built-in {metricName}. Script upload is optional.</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">{loading ? 'Uploading...' : 'Upload'}</button>
        </form>
      </div>
    </div>
  );
};

export default UploadSecrets;
