/**
 * ContestManagePage - Quản lý Cuộc thi (Issue #123).
 * Admin CRUD: Tạo / Sửa / Xoá mềm các Contest.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ContestService } from '../../../services/contestService';
import type { Contest, ContestCreateRequest, ContestUpdateRequest, ContestStatus } from '../../../models/api.types';

const STATUS_OPTIONS: ContestStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

// ===================== Confirm Modal =====================
interface ConfirmModalProps { title: string; message: string; onConfirm: () => void; onCancel: () => void; isLoading?: boolean; }
const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Huỷ</button>
        <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60">Xoá</button>
      </div>
    </div>
  </div>
);

// ===================== Form Modal =====================
interface ContestFormProps { initial?: Contest | null; onSave: (data: ContestCreateRequest | ContestUpdateRequest) => Promise<void>; onCancel: () => void; isSaving: boolean; }
const ContestFormModal: React.FC<ContestFormProps> = ({ initial, onSave, onCancel, isSaving }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<ContestStatus>(initial?.status ?? 'DRAFT');
  const [startTime, setStartTime] = useState(initial ? initial.start_time.slice(0, 16) : '');
  const [endTime, setEndTime] = useState(initial?.end_time ? initial.end_time.slice(0, 16) : '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!title.trim()) { setError('Tên cuộc thi không được để trống.'); return; }
    if (!startTime) { setError('Vui lòng chọn thời gian bắt đầu.'); return; }
    try {
      await onSave({ title: title.trim(), description: description.trim(), status, start_time: new Date(startTime).toISOString(), end_time: endTime ? new Date(endTime).toISOString() : null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{initial ? 'Chỉnh sửa cuộc thi' : 'Tạo cuộc thi mới'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2.5">{error}</div>}
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên cuộc thi *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={500} placeholder="VD: ICTU AI Challenge 2026" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
          </div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mô tả (Markdown)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Mô tả chi tiết..." className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none" />
          </div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
            <select value={status} onChange={e => setStatus(e.target.value as ContestStatus)} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bắt đầu *</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
            </div>
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kết thúc (tuỳ chọn)</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Huỷ</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-60">{initial ? 'Lưu thay đổi' : 'Tạo cuộc thi'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===================== Status Badge =====================
const StatusBadge: React.FC<{ status: ContestStatus }> = ({ status }) => {
  const map: Record<ContestStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    PUBLISHED: { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    ARCHIVED: { label: 'Archived', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' },
  };
  const { label, cls } = map[status] ?? map.DRAFT;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{label}</span>;
};

// ===================== Main Page =====================
const ContestManagePage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Contest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contest | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const PAGE_SIZE = 10;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchContests = useCallback(async (p: number = 1) => {
    setIsLoading(true);
    try {
      const res = await ContestService.getContests(p, PAGE_SIZE);
      setContests(res.items); setTotal(res.total); setTotalPages(res.total_pages); setPage(p);
    } catch { showToast('Không thể tải danh sách cuộc thi.', 'error'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchContests(1); }, [fetchContests]);

  const handleSave = async (data: ContestCreateRequest | ContestUpdateRequest) => {
    setIsSaving(true);
    try {
      if (editTarget) { await ContestService.updateContest(editTarget.id, data as ContestUpdateRequest); showToast('Đã cập nhật cuộc thi.'); }
      else { await ContestService.createContest(data as ContestCreateRequest); showToast('Đã tạo cuộc thi mới.'); }
      setShowForm(false); setEditTarget(null);
      await fetchContests(page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi.';
      showToast(msg, 'error');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await ContestService.deleteContest(deleteTarget.id); showToast('Đã xoá cuộc thi.');
      setDeleteTarget(null); await fetchContests(page);
    } catch { showToast('Không thể xoá cuộc thi này.', 'error'); }
    finally { setIsDeleting(false); }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-lg border animate-fade-in ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
          {toast.msg}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quản lý Cuộc thi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tổng cộng {total} cuộc thi</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tạo cuộc thi
        </button>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-surface-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : contests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Chưa có cuộc thi nào.</p>
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline">Tạo cuộc thi đầu tiên</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tên cuộc thi</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Trạng thái</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Bắt đầu</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Kết thúc</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {contests.map(contest => (
                  <tr key={contest.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4"><div className="font-semibold text-slate-900 dark:text-white line-clamp-1">{contest.title}</div></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><StatusBadge status={contest.status} /></td>
                    <td className="px-4 py-4 hidden md:table-cell text-slate-500 dark:text-slate-400 text-xs">{new Date(contest.start_time).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-slate-500 dark:text-slate-400 text-xs">{contest.end_time ? new Date(contest.end_time).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditTarget(contest); setShowForm(true); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Sửa</button>
                        <button onClick={() => setDeleteTarget(contest)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">Xoá</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => fetchContests(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">Trang trước</button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchContests(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => fetchContests(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">Trang sau</button>
        </div>
      )}
      {showForm && <ContestFormModal initial={editTarget} onSave={handleSave} onCancel={() => { setShowForm(false); setEditTarget(null); }} isSaving={isSaving} />}
      {deleteTarget && <ConfirmModal title="Xoá cuộc thi?" message={`Bạn có chắc muốn xoá "${deleteTarget.title}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isLoading={isDeleting} />}
    </div>
  );
};

export default ContestManagePage;
