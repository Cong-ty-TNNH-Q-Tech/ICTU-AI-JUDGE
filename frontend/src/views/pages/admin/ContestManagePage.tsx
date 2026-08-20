/**
 * ContestManagePage - Quan ly Cuoc thi (Issue #123).
 * Admin CRUD: Tao / Sua / Xoa mem cac Contest.
 * 
 * Tuan thu MVVM: Component chi nhan data va callbacks tu useContestManageVM.
 * Tuyet doi khong goi ContestService truc tiep trong View.
 */
import React, { useState } from 'react';
import { useContestManageVM } from '../../../viewmodels/useContestVM';
import { useAdminChallengesVM } from '../../../viewmodels/useAdminVM';
import { buildPageWindow } from '../../../utils/pagination';
import type { Contest, ContestCreateRequest, ContestUpdateRequest, ContestStatus, ChallengeCreateRequest } from '../../../models/api.types';
import ChallengeForm from '../../components/admin/ChallengeForm';

const STATUS_OPTIONS: ContestStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];


// ===================== Confirm Modal =====================
interface ConfirmModalProps { title: string; message: string; onConfirm: () => void; onCancel: () => void; isLoading?: boolean; }
const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Huy</button>
        <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60">Xoa</button>
      </div>
    </div>
  </div>
);

// ===================== Form Modal =====================
interface ContestFormProps { initial?: Contest | null; onSave: (data: ContestCreateRequest | ContestUpdateRequest) => Promise<void>; onCancel: () => void; isSaving: boolean; }
const ContestFormModal: React.FC<ContestFormProps> = ({ initial, onSave, onCancel, isSaving }) => {
  const toLocalDT = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<ContestStatus>(initial?.status ?? 'DRAFT');
  const [startTime, setStartTime] = useState(toLocalDT(initial?.start_time));
  const [endTime, setEndTime] = useState(toLocalDT(initial?.end_time));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!title.trim()) { setError('Tên cuộc thi không được để trống.'); return; }
    if (!startTime) { setError('Vui lòng chọn thời gian bắt đầu.'); return; }
    
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

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
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{initial ? 'Chinh sua cuoc thi' : 'Tao cuoc thi moi'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2.5">{error}</div>}
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ten cuoc thi *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={500} placeholder="VD: ICTU AI Challenge 2026" className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
          </div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mo ta (Markdown)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Mo ta chi tiet..." className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none" />
          </div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trang thai</label>
            <select value={status} onChange={e => setStatus(e.target.value as ContestStatus)} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bat dau *</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
            </div>
            <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ket thuc (tuy chon)</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Huy</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-60">{initial ? 'Luu thay doi' : 'Tao cuoc thi'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===================== Status Badge =====================
const StatusBadge: React.FC<{ status: ContestStatus }> = ({ status }) => {
  const map: Record<ContestStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'Bản nháp', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    PUBLISHED: { label: 'Đã phát hành', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    ARCHIVED: { label: 'Đã lưu trữ', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' },
  };
  const { label, cls } = map[status] ?? map.DRAFT;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{label}</span>;
};

// ===================== Main Page =====================
const ContestManagePage: React.FC = () => {
  // [MVVM] Moi interaction voi ContestService deu qua useContestManageVM
  const {
    contests, total, totalPages, page, isLoading, isSaving, isDeleting, error,
    createContest, updateContest, deleteContest, goToPage,
  } = useContestManageVM();

  const { createChallenge } = useAdminChallengesVM({ page: 1, size: 1 });

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Contest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contest | null>(null);
  const [addChallengeContestId, setAddChallengeContestId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (data: ContestCreateRequest | ContestUpdateRequest) => {
    try {
      if (editTarget) {
        await updateContest(editTarget.id, data as ContestUpdateRequest);
        showToast('Đã cập nhật cuộc thi.');
      } else {
        await createContest(data as ContestCreateRequest);
        showToast('Đã tạo cuộc thi mới.');
      }
      setShowForm(false);
      setEditTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi.';
      showToast(msg, 'error');
      throw err; // Re-throw de ContestFormModal hien thi loi trong form
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContest(deleteTarget.id);
      showToast('Đã xóa cuộc thi.');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa cuộc thi này.';
      showToast(msg, 'error');
    }
  };

  // Pagination window: toi da 7 nut (tranh overflow khi co nhieu trang)
  const pageWindow = buildPageWindow(page, totalPages);

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-lg border animate-fade-in ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
          {toast.msg}
        </div>
      )}
      {/* Error banner -- hien thi khi fetch that bai */}
      {/* Error banner -- hien thi khi fetch that bai */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-700 dark:text-red-400">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <span>{error}</span>
          <button onClick={() => goToPage(page)} className="ml-auto text-xs font-semibold underline hover:no-underline">Thử lại</button>
        </div>
      )}
      <div className="glass-panel overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary dark:text-content-dark-primary tracking-tight">Tất cả cuộc thi</h2>
            <p className="text-[13px] text-content-secondary dark:text-content-dark-secondary mt-1">{total} cuộc thi</p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary rounded-xl px-4 py-2.5 shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 hover:shadow-primary-500/30 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Tạo cuộc thi mới
          </button>
        </div>
        
        {/* Table Body */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : contests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Không tìm thấy cuộc thi nào.</p>
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="mt-3 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline">Tạo cuộc thi đầu tiên</button>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xs text-content-secondary dark:text-content-dark-secondary uppercase tracking-widest bg-transparent">
                  <th className="text-left px-5 py-3 font-semibold">Tiêu đề</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Bắt đầu</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kết thúc</th>
                  <th className="text-right px-5 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contests.map(contest => (
                  <tr key={contest.id} className="bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 shadow-sm rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px]">
                    <td className="px-5 py-4 rounded-l-xl">
                      <div className="font-semibold text-content-primary dark:text-content-dark-primary line-clamp-1">{contest.title}</div>
                      <div className="text-xs text-content-secondary mt-0.5">{contest.challenge_count} bài thi</div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell"><StatusBadge status={contest.status} /></td>
                    <td className="px-4 py-4 hidden md:table-cell text-content-secondary dark:text-content-dark-secondary text-xs">{new Date(contest.start_time).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-content-secondary dark:text-content-dark-secondary text-xs">{contest.end_time ? new Date(contest.end_time).toLocaleDateString('vi-VN') : '\u2014'}</td>
                    <td className="px-5 py-4 rounded-r-xl">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setAddChallengeContestId(contest.id)} className="glass-btn px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Thêm bài thi</button>
                        <button onClick={() => { setEditTarget(contest); setShowForm(true); }} className="glass-btn px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400">Sửa</button>
                        <button onClick={() => setDeleteTarget(contest)} className="glass-btn px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Windowed pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-white/10 flex items-center justify-center gap-3">
            <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium rounded-lg glass-btn disabled:opacity-40 shadow-sm">Trước</button>
            <div className="flex items-center gap-1">
              {pageWindow.map((p, idx) =>
                p === '...'
                  ? <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm select-none">...</span>
                  : <button key={p} onClick={() => goToPage(p as number)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-primary-500 text-white shadow-sm' : 'glass-btn hover:bg-white/80 dark:hover:bg-white/20'}`}>{p}</button>
              )}
            </div>
            <button onClick={() => goToPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium rounded-lg glass-btn disabled:opacity-40 shadow-sm">Sau</button>
          </div>
        )}
      </div>
      {showForm && <ContestFormModal initial={editTarget} onSave={handleSave} onCancel={() => { setShowForm(false); setEditTarget(null); }} isSaving={isSaving} />}
      {deleteTarget && <ConfirmModal title="Xóa cuộc thi?" message={`Bạn có chắc chắn muốn xóa "${deleteTarget.title}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isLoading={isDeleting} />}
      {addChallengeContestId && (
        <ChallengeForm 
          defaultContestId={addChallengeContestId}
          onSubmit={async (data, file, script, ratio) => {
            if (!file) throw new Error("File ground truth bị thiếu.");
            await createChallenge(data, file, script, ratio);
            setAddChallengeContestId(null);
            showToast('Đã thêm bài thi thành công.');
          }}
          onCancel={() => setAddChallengeContestId(null)}
        />
      )}
    </div>
  );
};

export default ContestManagePage;
