import { apiClient } from '../core/apiClient';
import type { Submission, SelectForPrivateRequest } from '../models/api.types';
import type { AxiosProgressEvent } from 'axios';

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
    
    const { data } = await apiClient.post<Submission>(
      `/challenges/${challengeId}/submissions`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress,
      }
    );
    return data;
  }
};
