/**
 * badges.ts — Badge definitions & computation logic (v2 — image-based).
 * Tuân thủ SRP: Chỉ chứa logic tính badge, không chứa UI.
 * 18 badges, mỗi badge có ảnh riêng được vẽ chuyên nghiệp.
 */

// Import all badge images
import badgeNewcomer from '../assets/badges/newcomer.png';
import badgeFirstSub from '../assets/badges/first_submission.png';
import badgeSub5 from '../assets/badges/sub_5.png';
import badgeSub10 from '../assets/badges/sub_10.png';
import badgeSub25 from '../assets/badges/sub_25.png';
import badgeSub50 from '../assets/badges/sub_50.png';
import badgeSub100 from '../assets/badges/sub_100.png';
import badgeSolAuthor from '../assets/badges/solution_author.png';
import badgeSol5 from '../assets/badges/sol_5.png';
import badgeSol10 from '../assets/badges/sol_10.png';
import badgeTop10 from '../assets/badges/top10.png';
import badgeTop3 from '../assets/badges/top3.png';
import badgeChampion from '../assets/badges/champion.png';
import badgeTeamPlayer from '../assets/badges/team_player.png';
import badgeDataExplorer from '../assets/badges/data_explorer.png';
import badgeRocket from '../assets/badges/rocket.png';
import badgeTarget from '../assets/badges/target.png';
import badgeLegend from '../assets/badges/legend.png';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  requirement: string;
  image: string;
  borderColor: string;   // Tailwind ring color for earned state
  checkFn: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalSubmissions: number;
  totalSolutions: number;
  bestRank: number | null;
}

export interface BadgeResult extends BadgeDefinition {
  earned: boolean;
}

/**
 * 18 achievement badges cho ICTU AI Judge.
 * Sắp xếp theo category: Submissions → Solutions → Rankings → Special
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ═══════════════════════════════════════
  // CATEGORY: Tham gia (Getting Started)
  // ═══════════════════════════════════════
  {
    id: 'newcomer',
    name: 'Tân Binh',
    description: 'Chào mừng bạn đến với ICTU AI Judge! Hành trình bắt đầu từ đây.',
    requirement: 'Đã tạo tài khoản',
    image: badgeNewcomer,
    borderColor: 'ring-cyan-400',
    checkFn: () => true,
  },
  {
    id: 'data_explorer',
    name: 'Nhà Thám Hiểm',
    description: 'Khám phá dữ liệu và tìm hiểu các cuộc thi trên nền tảng.',
    requirement: 'Tham gia 1+ cuộc thi',
    image: badgeDataExplorer,
    borderColor: 'ring-sky-400',
    checkFn: (s) => s.totalSubmissions >= 1,
  },

  // ═══════════════════════════════════════
  // CATEGORY: Nộp bài (Submissions)
  // ═══════════════════════════════════════
  {
    id: 'first_submission',
    name: 'Bước Đầu Tiên',
    description: 'Hoàn thành lượt nộp bài đầu tiên. Mọi hành trình vĩ đại đều bắt đầu bằng một bước nhỏ!',
    requirement: 'Nộp 1 bài',
    image: badgeFirstSub,
    borderColor: 'ring-emerald-400',
    checkFn: (s) => s.totalSubmissions >= 1,
  },
  {
    id: 'sub_5',
    name: 'Kiên Trì',
    description: 'Không bỏ cuộc sau những lần thử đầu tiên. Bạn đã nộp 5 bài!',
    requirement: 'Nộp 5 bài',
    image: badgeSub5,
    borderColor: 'ring-amber-600',
    checkFn: (s) => s.totalSubmissions >= 5,
  },
  {
    id: 'sub_10',
    name: 'Chiến Binh',
    description: 'Lửa chiến đấu cháy bỏng! 10 lượt nộp bài cho thấy sự nghiêm túc.',
    requirement: 'Nộp 10 bài',
    image: badgeSub10,
    borderColor: 'ring-orange-400',
    checkFn: (s) => s.totalSubmissions >= 10,
  },
  {
    id: 'sub_25',
    name: 'Tia Chớp',
    description: 'Nhanh như chớp! 25 lượt nộp bài — bạn đang thực sự nghiêm túc.',
    requirement: 'Nộp 25 bài',
    image: badgeSub25,
    borderColor: 'ring-yellow-400',
    checkFn: (s) => s.totalSubmissions >= 25,
  },
  {
    id: 'sub_50',
    name: 'Kim Cương',
    description: 'Hiếm có và quý giá! 50 lượt nộp bài — bạn là viên kim cương thực sự.',
    requirement: 'Nộp 50 bài',
    image: badgeSub50,
    borderColor: 'ring-red-400',
    checkFn: (s) => s.totalSubmissions >= 50,
  },
  {
    id: 'sub_100',
    name: 'Bách Chiến',
    description: 'Trăm trận trăm thắng! 100 lượt nộp bài — một kỳ tích ấn tượng.',
    requirement: 'Nộp 100 bài',
    image: badgeSub100,
    borderColor: 'ring-purple-400',
    checkFn: (s) => s.totalSubmissions >= 100,
  },

  // ═══════════════════════════════════════
  // CATEGORY: Giải pháp (Solutions)
  // ═══════════════════════════════════════
  {
    id: 'solution_author',
    name: 'Người Chia Sẻ',
    description: 'Chia sẻ giải pháp đầu tiên cho cộng đồng. Kiến thức nhân lên khi được chia sẻ!',
    requirement: 'Chia sẻ 1 giải pháp',
    image: badgeSolAuthor,
    borderColor: 'ring-violet-400',
    checkFn: (s) => s.totalSolutions >= 1,
  },
  {
    id: 'sol_5',
    name: 'Nhà Giáo Dục',
    description: 'Đóng góp 5 giải pháp — bạn đang giúp cộng đồng phát triển mạnh mẽ.',
    requirement: 'Chia sẻ 5 giải pháp',
    image: badgeSol5,
    borderColor: 'ring-teal-400',
    checkFn: (s) => s.totalSolutions >= 5,
  },
  {
    id: 'sol_10',
    name: 'Giáo Sư',
    description: 'Bậc thầy chia sẻ kiến thức! 10 giải pháp — cống hiến phi thường.',
    requirement: 'Chia sẻ 10 giải pháp',
    image: badgeSol10,
    borderColor: 'ring-indigo-400',
    checkFn: (s) => s.totalSolutions >= 10,
  },

  // ═══════════════════════════════════════
  // CATEGORY: Xếp hạng (Rankings)
  // ═══════════════════════════════════════
  {
    id: 'top_10',
    name: 'Top 10',
    description: 'Lọt vào nhóm 10 người dẫn đầu bảng xếp hạng — xuất sắc!',
    requirement: 'Đạt hạng Top 10',
    image: badgeTop10,
    borderColor: 'ring-slate-400',
    checkFn: (s) => s.bestRank !== null && s.bestRank <= 10,
  },
  {
    id: 'top_3',
    name: 'Chiến Thắng',
    description: 'Top 3 bảng xếp hạng! Bạn nằm trong nhóm tinh hoa nhất.',
    requirement: 'Đạt hạng Top 3',
    image: badgeTop3,
    borderColor: 'ring-amber-400',
    checkFn: (s) => s.bestRank !== null && s.bestRank <= 3,
  },
  {
    id: 'champion',
    name: 'Nhà Vô Địch',
    description: 'Đứng đầu bảng xếp hạng! Vua của cuộc thi, không ai sánh kịp.',
    requirement: 'Đạt hạng #1',
    image: badgeChampion,
    borderColor: 'ring-yellow-500',
    checkFn: (s) => s.bestRank !== null && s.bestRank === 1,
  },

  // ═══════════════════════════════════════
  // CATEGORY: Đặc biệt (Special)
  // ═══════════════════════════════════════
  {
    id: 'team_player',
    name: 'Đồng Đội',
    description: 'Sức mạnh đến từ tập thể! Bạn đã tham gia cuộc thi cùng đội nhóm.',
    requirement: 'Tham gia 1 đội',
    image: badgeTeamPlayer,
    borderColor: 'ring-pink-400',
    checkFn: (s) => s.totalSubmissions >= 1, // Approximation
  },
  {
    id: 'rocket',
    name: 'Phi Thuyền',
    description: 'Tốc độ nộp bài ấn tượng! Bạn nộp nhanh và chính xác.',
    requirement: 'Nộp 3+ bài trong 1 ngày',
    image: badgeRocket,
    borderColor: 'ring-orange-500',
    checkFn: (s) => s.totalSubmissions >= 3,
  },
  {
    id: 'target',
    name: 'Thiện Xạ',
    description: 'Chính xác tuyệt đối! Đạt điểm cao ngay từ những lần nộp đầu tiên.',
    requirement: 'Đạt Top 10 với ≤5 lần nộp',
    image: badgeTarget,
    borderColor: 'ring-red-500',
    checkFn: (s) => s.bestRank !== null && s.bestRank <= 10 && s.totalSubmissions <= 5,
  },
  {
    id: 'legend',
    name: 'Huyền Thoại',
    description: 'Truyền thuyết sống! Bạn đã chinh phục mọi thử thách trên ICTU AI Judge.',
    requirement: 'Top 3 + 50 bài nộp + 5 giải pháp',
    image: badgeLegend,
    borderColor: 'ring-fuchsia-400',
    checkFn: (s) =>
      s.bestRank !== null && s.bestRank <= 3 &&
      s.totalSubmissions >= 50 &&
      s.totalSolutions >= 5,
  },
];

/**
 * Compute which badges a user has earned based on their stats.
 */
export function computeUserBadges(stats: BadgeStats): BadgeResult[] {
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    earned: badge.checkFn(stats),
  }));
}

/**
 * Count how many badges a user has earned.
 */
export function countEarnedBadges(stats: BadgeStats): number {
  return BADGE_DEFINITIONS.filter((b) => b.checkFn(stats)).length;
}
