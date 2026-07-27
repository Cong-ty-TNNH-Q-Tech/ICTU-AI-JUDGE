import React, { useState, useEffect } from 'react';
import type { Challenge, ChallengeCreateRequest } from '../../../models/api.types';

interface Props {
  initialData?: Challenge | null;
  onSubmit: (data: ChallengeCreateRequest) => Promise<void>;
  onCancel: () => void;
}

const ChallengeForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const isEdit = !!initialData;
  const isLocked = initialData?.status === 'PUBLISHED';

  const [form, setForm] = useState<ChallengeCreateRequest>({
    title: '', description: '', start_time: '', end_time: '',
    type: 'PUBLIC', status: 'DRAFT', dataset_url: '',
    metric_name: 'ACCURACY', metric_direction: 'HIGHER_IS_BETTER',
    max_file_size_mb: 50, rate_limit_minutes: 10, max_team_size: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    }
  }, [initialData]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onSubmit(form); } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4 animate-fade-in overflow-y-auto">
      <div className="bg-surface dark:bg-surface-dark border border-surface-200 dark:border-gray-800 w-full max-w-3xl rounded-2xl shadow-elevated my-8 animate-scale-in">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-base font-semibold text-content-primary dark:text-content-dark-primary">{isEdit ? 'Edit Competition' : 'New Competition'}</h2>
          <button onClick={onCancel} className="w-7 h-7 rounded-md hover:bg-surface-100 dark:hover:bg-gray-800 flex items-center justify-center text-content-tertiary hover:text-content-primary transition-colors text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-lg text-[13px]">{error}</div>}
          {isLocked && <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 rounded-lg text-[13px]">Published competition — some fields are locked.</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Title</label>
                <input required type="text" name="title" value={form.title} onChange={set} className="input-field" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={set} rows={4} className="input-field resize-none"></textarea>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Dataset URL</label>
                <input type="url" name="dataset_url" value={form.dataset_url} onChange={set} className="input-field" placeholder="https://drive.google.com/..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Start</label>
                  <input required type="datetime-local" name="start_time" value={form.start_time?.substring(0, 16)} onChange={set} className="input-field" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">End</label>
                  <input required type="datetime-local" name="end_time" value={form.end_time?.substring(0, 16)} onChange={set} className="input-field" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Metric</label>
                <select name="metric_name" value={form.metric_name} onChange={set} disabled={isLocked} className="input-field disabled:opacity-50">
                  <option value="ACCURACY">Accuracy</option><option value="F1_SCORE">F1 Score</option><option value="RMSE">RMSE</option><option value="CUSTOM">Custom</option>
                </select>
                {isLocked && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Locked after publishing</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Max File (MB)</label><input type="number" name="max_file_size_mb" min="1" value={form.max_file_size_mb} onChange={set} className="input-field" /></div>
                <div><label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Cooldown (min)</label><input type="number" name="rate_limit_minutes" min="0" value={form.rate_limit_minutes} onChange={set} className="input-field" /></div>
              </div>
              <div><label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Max team size</label><input type="number" name="max_team_size" min="1" value={form.max_team_size} onChange={set} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Type</label><select name="type" value={form.type} onChange={set} className="input-field"><option value="PUBLIC">Public</option><option value="COMPETITION">Competition</option></select></div>
                <div><label className="block text-[13px] font-medium text-content-secondary dark:text-content-dark-secondary mb-1.5">Status</label><select name="status" value={form.status} onChange={set} className="input-field"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-200 dark:border-gray-800 flex justify-end gap-2.5">
            <button type="button" onClick={onCancel} className="btn-ghost border border-surface-200 dark:border-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">{loading ? 'Saving...' : (isEdit ? 'Save changes' : 'Create competition')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengeForm;
