import { apiClient } from '../core/apiClient';
import type { Submission, SelectForPrivateRequest, SourceCodeUploadResponse } from '../models/api.types';
import type { AxiosProgressEvent } from 'axios';
import axios from 'axios';

export class SubmissionError extends Error {
  constructor(
    message: string,
    public status?: number,
    public waitMinutes?: number,
    public isRateLimit?: boolean,
    public isDuplicate?: boolean,
  ) {
    super(message);
    this.name = 'SubmissionError';
  }
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
    onProgress: (progressEvent: AxiosProgressEvent) => void
  ): Promise<Submission> {
    const formData = new FormData();
    formData.append('file', file);
    
    
    try {
      const { data } = await apiClient.post<Submission>(
        `/challenges/${challengeId}/submissions`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress,
        }
      );
      return data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 429) {
          const waitMinutes = err.response.data?.wait_minutes || 1;
          throw new SubmissionError(`Vi phạm Rate Limit. Vui lòng thử lại sau.`, 429, waitMinutes, true, false);
        } else if (err.response.status === 409) {
          throw new SubmissionError('File này đã được nộp trước đó. Vui lòng không nộp trùng lặp.', 409, 0, false, true);
        } else {
          throw new SubmissionError(err.response.data?.detail || err.message || 'Lỗi nộp bài', err.response.status);
        }
      }
      throw err;
    }
  },

  /** UC06 — Nộp Source Code (Anti-Cheat) */
  async uploadSourceCodeWithProgress(
    submissionId: string, 
    file: File, 
    onProgress: (progressEvent: AxiosProgressEvent) => void
  ): Promise<SourceCodeUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data } = await apiClient.post<SourceCodeUploadResponse>(
      `/submissions/${submissionId}/source-code`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      }
    );
    return data;
  }
};
