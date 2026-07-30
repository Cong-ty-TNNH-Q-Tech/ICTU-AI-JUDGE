/**
 * Unit tests cho badges.ts — kiểm chứng logic tính badge.
 * Tuân thủ review Vòng 10: Core Domain Logic phải có test đi kèm.
 */
import { describe, it, expect } from 'vitest';
import { computeUserBadges, countEarnedBadges, BADGE_DEFINITIONS } from './badges';
import type { BadgeStats } from './badges';

describe('badges', () => {
  describe('BADGE_DEFINITIONS', () => {
    it('should have 18 badge definitions', () => {
      expect(BADGE_DEFINITIONS).toHaveLength(18);
    });

    it('should have unique IDs for each badge', () => {
      const ids = BADGE_DEFINITIONS.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('each badge should have required fields', () => {
      for (const badge of BADGE_DEFINITIONS) {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.requirement).toBeTruthy();
        expect(badge.image).toBeTruthy();
        expect(badge.borderColor).toBeTruthy();
        expect(typeof badge.checkFn).toBe('function');
      }
    });
  });

  describe('computeUserBadges', () => {
    it('should return results for all badge definitions', () => {
      const stats: BadgeStats = { totalSubmissions: 0, totalSolutions: 0, bestRank: null };
      const results = computeUserBadges(stats);
      expect(results).toHaveLength(BADGE_DEFINITIONS.length);
    });

    it('newcomer should always be earned for any user', () => {
      const stats: BadgeStats = { totalSubmissions: 0, totalSolutions: 0, bestRank: null };
      const results = computeUserBadges(stats);
      const newcomer = results.find((b) => b.id === 'newcomer');
      expect(newcomer?.earned).toBe(true);
    });

    it('new user with zero stats should only earn newcomer badge', () => {
      const stats: BadgeStats = { totalSubmissions: 0, totalSolutions: 0, bestRank: null };
      const results = computeUserBadges(stats);
      const earnedBadges = results.filter((b) => b.earned);
      expect(earnedBadges).toHaveLength(1);
      expect(earnedBadges[0].id).toBe('newcomer');
    });

    it('user with 1 submission should earn submission-related badges', () => {
      const stats: BadgeStats = { totalSubmissions: 1, totalSolutions: 0, bestRank: null };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('newcomer');
      expect(earned).toContain('first_submission');
      expect(earned).toContain('data_explorer');
      expect(earned).toContain('team_player'); // approximation: >= 1 submission
    });

    it('user with 50 submissions should earn progressive submission badges', () => {
      const stats: BadgeStats = { totalSubmissions: 50, totalSolutions: 0, bestRank: null };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('first_submission');
      expect(earned).toContain('sub_5');
      expect(earned).toContain('sub_10');
      expect(earned).toContain('sub_25');
      expect(earned).toContain('sub_50');
      expect(earned).not.toContain('sub_100');
    });

    it('user with 100 submissions should earn all submission badges', () => {
      const stats: BadgeStats = { totalSubmissions: 100, totalSolutions: 0, bestRank: null };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('sub_100');
    });

    it('user with 1 solution should earn solution_author', () => {
      const stats: BadgeStats = { totalSubmissions: 0, totalSolutions: 1, bestRank: null };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('solution_author');
      expect(earned).not.toContain('sol_5');
    });

    it('user with 10 solutions should earn all solution badges', () => {
      const stats: BadgeStats = { totalSubmissions: 0, totalSolutions: 10, bestRank: null };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('solution_author');
      expect(earned).toContain('sol_5');
      expect(earned).toContain('sol_10');
    });

    it('user with rank 1 should earn all ranking badges', () => {
      const stats: BadgeStats = { totalSubmissions: 1, totalSolutions: 0, bestRank: 1 };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('top_10');
      expect(earned).toContain('top_3');
      expect(earned).toContain('champion');
    });

    it('user with rank 5 should earn top_10 but not top_3 or champion', () => {
      const stats: BadgeStats = { totalSubmissions: 1, totalSolutions: 0, bestRank: 5 };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).toContain('top_10');
      expect(earned).not.toContain('top_3');
      expect(earned).not.toContain('champion');
    });

    it('user with rank 15 should not earn any ranking badge', () => {
      const stats: BadgeStats = { totalSubmissions: 1, totalSolutions: 0, bestRank: 15 };
      const results = computeUserBadges(stats);
      const earned = results.filter((b) => b.earned).map((b) => b.id);
      expect(earned).not.toContain('top_10');
      expect(earned).not.toContain('top_3');
      expect(earned).not.toContain('champion');
    });

    it('target badge requires top 10 with ≤5 submissions', () => {
      // Qualifies: rank 5, 3 submissions
      const qualifies: BadgeStats = { totalSubmissions: 3, totalSolutions: 0, bestRank: 5 };
      const r1 = computeUserBadges(qualifies);
      expect(r1.find((b) => b.id === 'target')?.earned).toBe(true);

      // Does not qualify: rank 5, 10 submissions
      const tooMany: BadgeStats = { totalSubmissions: 10, totalSolutions: 0, bestRank: 5 };
      const r2 = computeUserBadges(tooMany);
      expect(r2.find((b) => b.id === 'target')?.earned).toBe(false);
    });

    it('legend badge requires top 3 + 50 subs + 5 solutions', () => {
      // Full legend
      const legend: BadgeStats = { totalSubmissions: 50, totalSolutions: 5, bestRank: 2 };
      const r1 = computeUserBadges(legend);
      expect(r1.find((b) => b.id === 'legend')?.earned).toBe(true);

      // Missing solutions
      const noSols: BadgeStats = { totalSubmissions: 50, totalSolutions: 2, bestRank: 2 };
      const r2 = computeUserBadges(noSols);
      expect(r2.find((b) => b.id === 'legend')?.earned).toBe(false);

      // Missing rank
      const noRank: BadgeStats = { totalSubmissions: 50, totalSolutions: 5, bestRank: null };
      const r3 = computeUserBadges(noRank);
      expect(r3.find((b) => b.id === 'legend')?.earned).toBe(false);
    });
  });

  describe('countEarnedBadges', () => {
    it('new user should have exactly 1 earned badge (newcomer)', () => {
      const stats: BadgeStats = { totalSubmissions: 0, totalSolutions: 0, bestRank: null };
      expect(countEarnedBadges(stats)).toBe(1);
    });

    it('should count correctly for a power user', () => {
      // A user with 100 subs, 10 sols, rank 1 should have many badges
      const stats: BadgeStats = { totalSubmissions: 100, totalSolutions: 10, bestRank: 1 };
      const count = countEarnedBadges(stats);
      // newcomer + data_explorer + first_sub + sub_5/10/25/50/100 + sol_author + sol_5 + sol_10
      // + top_10 + top_3 + champion + team_player + rocket = 15
      // target: rank <= 10 but subs > 5 => false
      // legend: rank <= 3, subs >= 50, sols >= 5 => true => 16
      expect(count).toBeGreaterThanOrEqual(15);
    });
  });
});
