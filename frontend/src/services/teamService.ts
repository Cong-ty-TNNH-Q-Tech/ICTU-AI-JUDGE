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

// ====== MOCK DATA — Tuân thủ openapi.yaml schema ======
// Dùng khi VITE_MOCK_AUTH=true hoặc API chưa ready

const MOCK_TEAMS: TeamResponse[] = [
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Team Alpha ICTU',
    challenge_id: '11111111-1111-1111-1111-111111111111',
    leader_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    member_ids: [
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ],
  },
];


// ====== SERVICE ======

export const teamService = {
  /** GET /users/me/teams — Teams của user hiện tại */
  async getMyTeams(params?: { page?: number; size?: number }): Promise<MyTeamsResponse> {
    const { data } = await apiClient.get<MyTeamsResponse>('/users/me/teams', { params });
    return data;
  },

  /** GET team theo challenge_id từ /users/me/teams (filter client-side) */
  async getMyTeamInChallenge(challengeId: string): Promise<TeamResponse | null> {
    try {
      const result = await teamService.getMyTeams({ size: 100 });
      return result.items.find((t: TeamResponse) => t.challenge_id === challengeId) ?? null;
    } catch {
      // Fallback mock
      return MOCK_TEAMS.find(t => t.challenge_id === challengeId) ?? null;
    }
  },

  /** GET team by ID (if endpoint exists, else filter from my teams or mock) */
  async getTeamById(teamId: string): Promise<TeamResponse | null> {
    try {
      const result = await teamService.getMyTeams({ size: 100 });
      return result.items.find((t: TeamResponse) => t.id === teamId) ?? null;
    } catch {
      return MOCK_TEAMS.find(t => t.id === teamId) ?? null;
    }
  },

  /** POST /teams/{id}/invites — Leader tạo mã mời */
  async createInvite(teamId: string): Promise<CreateInviteResponse> {
    try {
      const { data } = await apiClient.post<CreateInviteResponse>(
        `/teams/${teamId}/invites`,
        {}
      );
      return data;
    } catch (error) {
      if (import.meta.env.DEV || import.meta.env.VITE_MOCK_AUTH === 'true') {
        // Lazy-evaluate window.location.origin at call time (Bug-6 fix)
        await new Promise(r => setTimeout(r, 500));
        return {
          token: 'mock_token_aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpP',
          invite_url: `${window.location.origin}/teams/join?token=mock_token_aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpP`,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        };
      }
      throw error;
    }
  },

  /** POST /teams/join — Gia nhập đội qua token */
  async joinTeam(payload: JoinTeamRequest): Promise<JoinTeamResponse> {
    try {
      const { data } = await apiClient.post<JoinTeamResponse>('/teams/join', payload);
      return data;
    } catch (error) {
       if (import.meta.env.DEV || import.meta.env.VITE_MOCK_AUTH === 'true') {
         await new Promise(r => setTimeout(r, 800));
         if (payload.token === 'expired') throw new Error('Mã mời không hợp lệ hoặc đã hết hạn');
         return MOCK_TEAMS[0];
       }
       throw error;
    }
  },

  // Mock helpers (chỉ dùng trong development)
  _mockTeams: MOCK_TEAMS,
};
