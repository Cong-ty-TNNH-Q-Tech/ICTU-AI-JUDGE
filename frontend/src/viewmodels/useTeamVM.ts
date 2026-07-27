import { useState, useCallback, useEffect, useRef } from 'react';
import { teamService } from '../services/teamService';
import { useAuthStore } from '../store';
import type { TeamDetailVM, CreateInviteResponse, TeamMemberInfo } from '../models/api.types';
import { useToast } from '../views/components/Toast';

export function useTeamVM(teamId: string | undefined) {
  const { user } = useAuthStore();
  const [team, setTeam] = useState<TeamDetailVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<CreateInviteResponse | null>(null);
  
  const { showToast, ToastContainer } = useToast();

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const teamData = await teamService.getTeamById(teamId);
      if (!teamData) {
        throw new Error('Không tìm thấy đội');
      }

      // Enrich with mock members (Development)
      const mockMembers: TeamMemberInfo[] = teamData.member_ids.map(id => ({
        user_id: id,
        full_name: id === teamData.leader_id ? 'Trưởng nhóm' : 'Thành viên',
        email: 'mock@ictu.edu.vn',
        joined_at: teamData.created_at,
      }));

      const enriched: TeamDetailVM = {
        ...teamData,
        members: mockMembers,
        has_submissions: false,
      };

      setTeam(enriched);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Lỗi khi tải thông tin đội');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const createInvite = useCallback(async () => {
    if (!teamId) return;
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const result = await teamService.createInvite(teamId);
      setInviteResult(result);
      showToast('Tạo link mời thành công!', 'success');
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number, data?: { detail?: string } } };
      const status = errorObj.response?.status;
      const detail: string = errorObj.response?.data?.detail ?? '';
      if (status === 403) showToast('Chỉ trưởng nhóm mới được tạo mã mời', 'error');
      else if (status === 400 && detail.includes('tối đa')) showToast('Đội đã đủ số lượng thành viên tối đa', 'error');
      else if (status === 400 && detail.includes('hạn')) showToast('Đã qua hạn chốt đội, không thể mời thêm', 'error');
      else showToast('Lỗi khi tạo mã mời', 'error');
    } finally {
      setInviteLoading(false);
    }
  }, [teamId, showToast]);

  const isLeader = Boolean(user && team && team.leader_id === user.id);
  // Optional: check against challenge deadline. Hardcoded as false for now until challenge fetch.
  const isDeadlinePassed = false; 

  return {
    team,
    loading,
    error,
    inviteLoading,
    inviteResult,
    isLeader,
    canInvite: isLeader && !isDeadlinePassed,
    createInvite,
    showToast,
    ToastContainer,
  };
}

export function useJoinTeamVM() {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamInfo, setTeamInfo] = useState<{ name: string; challenge_id: string } | null>(null);

  const calledRef = useRef(false);

  const handleJoin = useCallback(async (token: string) => {
    if (calledRef.current) return;
    calledRef.current = true;
    
    setJoining(true);
    setError(null);
    try {
      const result = await teamService.joinTeam({ token });
      setTeamInfo({ name: result.name, challenge_id: result.challenge_id });
      setJoined(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number, data?: { detail?: string } }, message?: string };
      const status = errorObj.response?.status;
      const detail: string = errorObj.response?.data?.detail ?? errorObj.message ?? '';
      if (status === 400 && detail.includes('tối đa')) {
        setError('Đội đã đầy. Bạn không thể gia nhập.');
      } else if (status === 400 && detail.includes('đội khác')) {
        setError('Bạn đã thuộc một đội thi khác trong bài thi này.');
      } else if (status === 400 && (detail.includes('hết hạn') || detail.includes('hợp lệ'))) {
        setError('Link mời đã hết hạn hoặc không hợp lệ.');
      } else {
        setError(detail || 'Lỗi khi gia nhập đội.');
      }
    } finally {
      setJoining(false);
    }
  }, []);

  return { joining, joined, error, teamInfo, handleJoin };
}
