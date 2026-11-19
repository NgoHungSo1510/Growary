import { httpClient } from './client';
import type {
    AdminSeasonSummaryDTO,
    AdminUpdateTierPayload,
    PassQuestDefinition,
    SeasonPassConfigPatch,
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

    /** Update Free and Elite rewards and xpRequired for a tier level (1-80) on an unsettled season. */
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

    /** Update season pass config: elite unlock cost, vault limits, and default XP per level. */
    async updateSeasonConfig(
        seasonId: string,
        payload: SeasonPassConfigPatch
    ): Promise<{ message: string; season: SeasonPassDTO }> {
        return httpClient.put<{ message: string; season: SeasonPassDTO }>(
            `/admin/season-pass/${seasonId}/config`,
            payload
        );
    },

    /** Create a new quest for the season. */
    async createQuest(
        seasonId: string,
        payload: PassQuestDefinition
    ): Promise<{ message: string; quest: PassQuestDefinition }> {
        return httpClient.post<{ message: string; quest: PassQuestDefinition }>(
            `/admin/season-pass/${seasonId}/quests`,
            payload
        );
    },

    /** Update an existing quest definition. */
    async updateQuest(
        seasonId: string,
        questCode: string,
        payload: Partial<PassQuestDefinition>
    ): Promise<{ message: string; quest: PassQuestDefinition }> {
        return httpClient.put<{ message: string; quest: PassQuestDefinition }>(
            `/admin/season-pass/${seasonId}/quests/${questCode}`,
            payload
        );
    },

    /** Delete a quest from the season. */
    async deleteQuest(
        seasonId: string,
        questCode: string
    ): Promise<{ message: string }> {
        return httpClient.delete<{ message: string }>(
            `/admin/season-pass/${seasonId}/quests/${questCode}`
        );
    },
};

