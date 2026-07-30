/**
 * Challenge Service — Gọi API Challenge endpoints.
 */
import { apiClient } from '../core/apiClient';
import type {
  Challenge,
  ChallengeCreateRequest,
  ChallengeUpdateRequest,
  PaginatedResponse,
  Participant,
  Submission,
  AddParticipantsRequest,
  LeaderboardType,
  Solution,
  LeaderboardResponse,
  ContestLeaderboardResponse,
} from '../models/api.types';

export const challengeService = {
  /** Danh sách bài thi (phân trang). */
  async list(params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PaginatedResponse<Challenge>> {
    const { data } = await apiClient.get<PaginatedResponse<Challenge>>('/challenges', { params });
    return data;
  },

  /** Chi tiết bài thi. */
  async getById(id: string): Promise<Challenge> {
    const { data } = await apiClient.get<Challenge>(`/challenges/${id}`);
    return data;
  },

  /**
   * UC09 — Tạo bài thi mới (Admin).
   * Gửi JSON body. File (Ground Truth, Metric Script) phải upload RIÊNG
   * qua uploadSecrets() SAU khi có challenge.id.
   * Backend nhận application/json — Pydantic Schema, không phải multipart.
   */
  async create(payload: ChallengeCreateRequest): Promise<Challenge> {
    const { data } = await apiClient.post<Challenge>('/challenges', payload);
    return data;
  },

  /**
   * UC09 — Cập nhật bài thi (Admin).
   * Gửi JSON body. Nếu Admin muốn cập nhật file mới,
   * gọi uploadSecrets() RIÊNG SAU khi update thành công.
   * Backend nhận application/json — Pydantic Schema, không phải multipart.
   */
  async update(id: string, payload: ChallengeUpdateRequest): Promise<Challenge> {
    const { data } = await apiClient.patch<Challenge>(`/challenges/${id}`, payload);
    return data;
  },

  /** UC09 — Soft delete bài thi (Admin). */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/challenges/${id}`);
  },

  /** Upload Ground Truth + Custom Metric (Admin). */
  async uploadSecrets(
    id: string,
    groundTruthFile: File,
    metricScriptFile?: File,
    publicTestSplitRatio: number = 30,
  ): Promise<void> {
    const formData = new FormData();
    formData.append('ground_truth_csv', groundTruthFile);
    if (metricScriptFile) {
      formData.append('metric_script_py', metricScriptFile);
    }
    formData.append('public_test_split_ratio', publicTestSplitRatio.toString());
    await apiClient.post(`/challenges/${id}/upload-secrets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** UC03 — Ghi danh vào Public Challenge. */
  async enroll(id: string): Promise<{ team_id: string }> {
    const { data } = await apiClient.post<{ team_id: string }>(`/challenges/${id}/enroll`);
    return data;
  },

  /** UC10 — Xem Whitelist participants (Admin). */
  async listParticipants(
    id: string,
    params?: { page?: number; size?: number },
  ): Promise<PaginatedResponse<Participant>> {
    const { data } = await apiClient.get<PaginatedResponse<Participant>>(
      `/challenges/${id}/participants`,
      { params },
    );
    return data;
  },

  /** UC10 — Thêm participants vào Whitelist bằng UUID (Admin). */
  async addParticipants(id: string, payload: AddParticipantsRequest): Promise<void> {
    await apiClient.post(`/challenges/${id}/participants`, payload);
  },

  /**
   * UC10 — Thêm participants vào Whitelist bằng Email / MSSV / UUID (Issue #91).
   * Backend tự resolve identifier → user_id.
   * Returns { added, resolved, not_found, detail }
   */
  async addParticipantsByIdentifiers(
    id: string,
    identifiers: string[],
  ): Promise<{ added: number; resolved: number; not_found: string[]; detail: string }> {
    const { data } = await apiClient.post<{
      added: number;
      resolved: number;
      not_found: string[];
      detail: string;
    }>(`/challenges/${id}/participants/by-identifiers`, { identifiers });
    return data;
  },

  /** UC04 — Lịch sử nộp bài của Đội. */
  async listSubmissions(
    id: string,
    params?: { page?: number; size?: number },
  ): Promise<PaginatedResponse<Submission>> {
    const { data } = await apiClient.get<PaginatedResponse<Submission>>(
      `/challenges/${id}/submissions`,
      { params },
    );
    return data;
  },

  /** UC04 — Nộp bài dự thi. */
  async submitFile(id: string, file: File): Promise<Submission> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<Submission>(
      `/challenges/${id}/submissions`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  /** UC07 — Bảng xếp hạng. */
  async getLeaderboard(
    id: string,
    params?: { type?: LeaderboardType; page?: number; size?: number },
  ): Promise<LeaderboardResponse> {
    const { data } = await apiClient.get<LeaderboardResponse>(
      `/challenges/${id}/leaderboard`,
      { params },
    );
    return data;
  },

  /** Bảng xếp hạng Contest */
  async getContestLeaderboard(
    id: string,
    params?: { type?: LeaderboardType },
  ): Promise<ContestLeaderboardResponse> {
    const { data } = await apiClient.get<ContestLeaderboardResponse>(
      `/challenges/${id}/contest-leaderboard`,
      { params },
    );
    return data;
  },

  /** Feature: Kernels / Solutions - Lấy danh sách giải pháp */
  async listSolutions(
    id: string,
  ): Promise<PaginatedResponse<Solution>> {
    const { data } = await apiClient.get<PaginatedResponse<Solution>>(
      `/challenges/${id}/solutions`,
    );
    return data;
  },

  /** Feature: Kernels / Solutions - Đăng tải giải pháp */
  async publishSolution(
    id: string,
    title: string,
    content: string,
    file: File,
  ): Promise<Solution> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('file', file);

    const { data } = await apiClient.post<Solution>(
      `/challenges/${id}/solutions`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  /** Feature: Kernels / Solutions - Upvote một giải pháp */
  async upvoteSolution(challengeId: string, solutionId: string): Promise<Solution> {
    const { data } = await apiClient.post<Solution>(
      `/challenges/${challengeId}/solutions/${solutionId}/upvote`,
    );
    return data;
  },
};
