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

export type MetricDirection = 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';

export type SubmissionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type LeaderboardType = 'public' | 'private';

// ==========================================
// ENTITIES (Response từ API)
// ==========================================

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface Team {
  id: string;
  name: string;
  challenge_id: string;
  leader_id: string;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: ChallengeType;
  status: ChallengeStatus;
  start_time: string;  // ISO 8601
  end_time: string;
  team_lock_deadline?: string;
  rate_limit_minutes: number;
  max_file_size_mb: number;
  metric_name: string;
  metric_direction: MetricDirection;
  dataset_url: string;
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
  last_submission_time: string;
  is_selected_for_private: boolean;
}

export interface Participant {
  user_id: string;
  email: string;
  full_name: string;
  is_approved: boolean;
  joined_at: string;
}

// ==========================================
// REQUEST PAYLOADS
// ==========================================

export interface GoogleLoginRequest {
  google_token: string;
}

export interface ChallengeCreateRequest {
  title: string;
  description?: string;
  type: ChallengeType;
  status?: ChallengeStatus;
  start_time: string;
  end_time: string;
  team_lock_deadline?: string;
  rate_limit_minutes?: number;
  max_file_size_mb?: number;
  metric_name: string;
  metric_direction: MetricDirection;
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

// ==========================================
// ERROR
// ==========================================

export interface ApiError {
  detail: string | Array<{ msg: string; loc: string[]; type: string }>;
  wait_minutes?: number;
  max_mb?: number;
}
