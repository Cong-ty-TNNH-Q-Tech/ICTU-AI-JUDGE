import { apiClient } from '../core/apiClient';
import type { Submission, SelectForPrivateRequest } from '../models/api.types';
import axios from 'axios';

export class RateLimitError extends Error {
  constructor(message: string, public waitMinutes: number) {
    super(message);
  }
}
export class DuplicateSubmissionError extends Error {}
export class APIError extends Error {}

export interface UploadProgressEvent {
  loaded: number;
  total?: number;
}

export const submissionService = {
  /** UC05 — Chọn/bỏ chọn submission cho Private Leaderboard */
  async selectForPrivate(submissionId: string, selected: boolean): Promise<Submission> {
    const payload: SelectForPrivateRequest = { is_selected_for_private: selected };
    const { data } = await apiClient.patch<Submission>(`/submissions/${submissionId}`, payload);
    return data;
  },

  /** UC04 — Nộp bài với progress bar (Axios) */
  async submitFileWithProgress(
    challengeId: string, 
    file: File, 
    onProgress: (progressEvent: UploadProgressEvent) => void
  ): Promise<Submission> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const { data } = await apiClient.post<Submission>(
        `/challenges/${challengeId}/submissions`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => onProgress({ loaded: e.loaded, total: e.total }),
        }
      );
      return data;
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 429) {
          const waitMinutes = err.response.data?.wait_minutes || 1;
          throw new RateLimitError('Vi phạm Rate Limit. Vui lòng thử lại sau.', waitMinutes);
        } else if (err.response.status === 409) {
          throw new DuplicateSubmissionError('File này đã được nộp trước đó. Vui lòng không nộp trùng lặp.');
        } else {
          throw new APIError(err.response.data?.detail || err.message || 'Lỗi nộp bài');
        }
      }
      throw err;
    }
  }
};
