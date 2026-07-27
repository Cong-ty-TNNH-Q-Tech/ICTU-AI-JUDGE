/**
 * Team Service — UC02: Quản lý Đội thi.
 * Ref: POST /teams/{id}/invites, POST /teams/join, GET /users/me/teams
 * Backend DTOs: team_dtos.py
 */
import { apiClient } from '../core/apiClient';
import type {
  TeamResponse,
  CreateInviteResponse,
  JoinTeamRequest,
  JoinTeamResponse,
  MyTeamsResponse,
} from '../models/api.types';

export const teamService = {
  /** GET /users/me/teams — Teams của user hiện tại */
  async getMyTeams(params?: { page?: number; size?: number }): Promise<MyTeamsResponse> {
    const { data } = await apiClient.get<MyTeamsResponse>('/users/me/teams', { params });
    return data;
  },

  /** GET team theo challenge_id từ /users/me/teams (filter client-side) */
  async getMyTeamInChallenge(challengeId: string): Promise<TeamResponse | null> {
    const result = await teamService.getMyTeams({ size: 100 });
    return result.items.find((t: TeamResponse) => t.challenge_id === challengeId) ?? null;
  },

  /** GET team by ID — filter từ /users/me/teams */
  async getTeamById(teamId: string): Promise<TeamResponse | null> {
    const result = await teamService.getMyTeams({ size: 100 });
    return result.items.find((t: TeamResponse) => t.id === teamId) ?? null;
  },

  /** POST /teams/{id}/invites — Leader tạo mã mời */
  async createInvite(teamId: string): Promise<CreateInviteResponse> {
    const { data } = await apiClient.post<CreateInviteResponse>(
      `/teams/${teamId}/invites`,
      {}
    );
    return data;
  },

  /** POST /teams/join — Gia nhập đội qua token */
  async joinTeam(payload: JoinTeamRequest): Promise<JoinTeamResponse> {
    const { data } = await apiClient.post<JoinTeamResponse>('/teams/join', payload);
    return data;
  },
};
