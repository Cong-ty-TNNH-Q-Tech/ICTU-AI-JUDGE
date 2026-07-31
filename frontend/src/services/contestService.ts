import { apiClient } from '../core/apiClient';
import { Challenge, Contest, ContestCreateRequest, ContestUpdateRequest } from '../models/api.types';

export interface PaginatedContestResponse {
  items: Contest[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface ContestChallengesResponse {
  contest_id: string;
  items: Challenge[];
  total: number;
}

export const ContestService = {
  getContests: async (
    page: number = 1,
    size: number = 20,
    status?: string
  ): Promise<PaginatedContestResponse> => {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const response = await apiClient.get<PaginatedContestResponse>('/contests', { params });
    return response.data;
  },

  getContestById: async (id: string): Promise<Contest> => {
    const response = await apiClient.get<Contest>(`/contests/${id}`);
    return response.data;
  },

  getChallengesByContest: async (contestId: string): Promise<ContestChallengesResponse> => {
    const response = await apiClient.get<ContestChallengesResponse>(`/contests/${contestId}/challenges`);
    return response.data;
  },

  createContest: async (data: ContestCreateRequest): Promise<Contest> => {
    const response = await apiClient.post<Contest>('/contests', data);
    return response.data;
  },

  updateContest: async (id: string, data: ContestUpdateRequest): Promise<Contest> => {
    const response = await apiClient.patch<Contest>(`/contests/${id}`, data);
    return response.data;
  },

  deleteContest: async (id: string): Promise<void> => {
    await apiClient.delete(`/contests/${id}`);
  },
};
