/**
 * API Types — ICTU AI JUDGE
 * Dựa trên docs/openapi.yaml. Đây là Single Source of Truth cho TypeScript.
 * Thành viên KHÔNG tự định nghĩa type riêng, phải dùng từ file này.
 */

// ==========================================
// ENUMS
// ==========================================

export type UserRole = 'STUDENT' | 'ADMIN';

export type ChallengeType = 'PUBLIC' | 'COMPETITION';

export type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ContestStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type MetricDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';

export type SubmissionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export type LeaderboardType = 'public' | 'private';

// ==========================================
// ENTITIES (Response từ API)
// ==========================================

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  student_id?: string;
  // Profile fields (Issue #30)
  github_url?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;  // Presigned URL (generated on-the-fly)
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  github_url?: string | null;
  linkedin_url?: string | null;
  avatar_url?: string | null;  // Presigned URL
  // Stats
  total_submissions: number;
  total_solutions: number;
  best_rank?: number | null;
}

export interface UpdateProfileRequest {
  full_name?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
}

export interface UserSolution {
  id: string;
  challenge_id: string;
  challenge_title: string;
  title: string;
  upvotes: number;
  created_at: string;  // ISO datetime string
}

export interface Team {
  id: string;
  name: string;
  challenge_id: string;
  leader_id: string;
}

// ==========================================
// TEAM TYPES (UC02) — Dựa trên TeamResponseDTO backend
// ==========================================

/** Khớp với TeamResponseDTO từ backend (team_dtos.py) */
export interface TeamResponse {
  id: string;
  name: string;
  challenge_id: string;
  leader_id: string;
  created_at: string;
  member_ids: string[];  // chỉ UUID, theo backend thực tế
}

/** Member info đầy đủ — cần join với User data */
export interface TeamMemberInfo {
  user_id: string;
  full_name: string;
  email: string;
  joined_at: string;
}

/** ViewModel-level enriched Team — sau khi merge data */
export interface TeamDetailVM {
  id: string;
  name: string;
  challenge_id: string;
  leader_id: string;
  created_at: string;
  member_ids: string[];
  // Enriched fields (populated bởi ViewModel từ API)
  members: TeamMemberInfo[];
  has_submissions: boolean;   // từ future API field
  challenge_title?: string;
}

export interface TeamUpdateRequest {
  name: string;
}

/** Khớp với CreateInviteResponseDTO backend */
export interface CreateInviteResponse {
  token: string;
  invite_url: string;
  expires_at: string;
}

export interface JoinTeamRequest {
  token: string;
}

/** POST /teams/join trả về TeamResponseDTO */
export type JoinTeamResponse = TeamResponse;

export interface Contest {
  id: string;
  title: string;
  description: string;
  status: ContestStatus;
  start_time: string; // ISO 8601
  end_time: string | null;
  created_at: string;
  created_by: string;
}

export interface ContestCreateRequest {
  title: string;
  description: string;
  status: ContestStatus;
  start_time: string;
  end_time?: string | null;
}

export interface ContestUpdateRequest {
  title?: string;
  description?: string;
  status?: ContestStatus;
  start_time?: string;
  end_time?: string | null;
}

export interface Challenge {
  id: string;
  contest_id?: string | null;
  title: string;
  description?: string;
  type: ChallengeType;
  status: ChallengeStatus;
  is_public: boolean;
  start_time: string;  // ISO 8601
  end_time: string | null;
  team_lock_deadline?: string;
  rate_limit_minutes: number;
  max_file_size_mb: number;
  max_team_size: number;
  metric_name: string;
  metric_direction: MetricDirection;
  environment_image: string;
  require_gpu: boolean;
  dataset_url: string;
  ground_truth_url?: string;
  custom_metric_url?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Submission {
  id: string;
  public_score: number | null;
  status: SubmissionStatus;
  is_selected_for_private: boolean;
  file_size_bytes: number;
  execution_time_ms: number | null;
  error_message: string | null;
  submitted_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  best_public_score: number;
  best_private_score: number | null;
  entries: number;
  last_submission_time: string;
  is_selected_for_private: boolean;
}

export interface LeaderboardResponse {
  total: number;
  page: number;
  size: number;
  items: LeaderboardEntry[];
}

export interface ContestLeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  total_score: number;
  scores: Record<string, number>;
}

export interface ContestLeaderboardResponse {
  contest_id: string;
  child_challenges: Challenge[];
  leaderboard: ContestLeaderboardEntry[];
}

export interface Participant {
  user_id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
  joined_at: string;
}

export interface Solution {
  id: string;
  challenge_id: string;
  user_id: string;
  author_name?: string;
  title: string;
  content: string;
  notebook_url: string;
  upvotes: number;
  created_at: string;
}

// ==========================================
// REQUEST PAYLOADS
// ==========================================

export interface GoogleLoginRequest {
  google_token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  student_id: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ChallengeCreateRequest {
  contest_id?: string | null;
  title: string;
  description?: string;
  type: ChallengeType;
  status?: ChallengeStatus;
  start_time: string;
  end_time: string | null;
  team_lock_deadline?: string;
  rate_limit_minutes?: number;
  max_file_size_mb?: number;
  max_team_size?: number;
  metric_name: string;
  metric_direction: MetricDirection;
  environment_image?: string;
  require_gpu?: boolean;
  dataset_url?: string;
}

export type ChallengeUpdateRequest = Partial<ChallengeCreateRequest>;

export interface SelectForPrivateRequest {
  is_selected_for_private: boolean;
}

export interface AddParticipantsRequest {
  user_ids: string[];
}

export interface UpdateUserStatusRequest {
  is_active: boolean;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

// ==========================================
// PAGINATION
// ==========================================

export interface PaginationMeta {
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface PaginatedResponse<T> extends PaginationMeta {
  items: T[];
}

export interface SolutionListResponse extends PaginatedResponse<Solution> {
  is_locked: boolean;
}

/** GET /users/me/teams trả về paginated Team list */
export type MyTeamsResponse = PaginatedResponse<TeamResponse>;

// ==========================================
// ERROR
// ==========================================

export interface ApiError {
  detail: string | Array<{ msg: string; loc: string[]; type: string }>;
  wait_minutes?: number;
  max_mb?: number;
}
