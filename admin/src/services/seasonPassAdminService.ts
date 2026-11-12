import { httpClient } from './client';
import type {
    AdminSeasonSummaryDTO,
    AdminUpdateTierPayload,
    SeasonPassDTO,
    SeasonPassLeaderboardEntry,
    SeasonPassTier,
} from '@shared';

export interface AdminSeasonDetailResponse {
    season: SeasonPassDTO;
    leaderboard: SeasonPassLeaderboardEntry[];
}

/**
 * Admin API service for managing Seasonal Battle Pass (Sổ Sứ Mệnh).
 */
export const seasonPassAdminService = {
    /** Fetch all seasonal battle pass summaries including participant counts. */
    async getSeasons(): Promise<{ seasons: AdminSeasonSummaryDTO[] }> {
        return httpClient.get<{ seasons: AdminSeasonSummaryDTO[] }>('/admin/season-pass/seasons');
    },

    /** Fetch season tiers, quests, and top-50 leaderboard for a specific season. */
    async getSeasonDetail(seasonId: string): Promise<AdminSeasonDetailResponse> {
        return httpClient.get<AdminSeasonDetailResponse>(`/admin/season-pass/${seasonId}`);
    },

    /** Update Free and Elite rewards for a tier level (1-80) on an unsettled season. */
    async updateTierReward(
        seasonId: string,
        level: number,
        payload: AdminUpdateTierPayload
    ): Promise<{ message: string; tier: SeasonPassTier }> {
        return httpClient.put<{ message: string; tier: SeasonPassTier }>(
            `/admin/season-pass/${seasonId}/tiers/${level}`,
            payload
        );
    },
};

