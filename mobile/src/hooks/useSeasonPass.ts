import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type {
    PassTrackType,
    PassGrantedRewards,
    SeasonPassActionResponse,
    SeasonPassLeaderboardResponse,
    SeasonPassMyProgressResponse,
} from '@shared';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { showApiError } from '../utils/errorHandler';
import { buildEventCacheKey, getEventCache, setEventCache } from '../utils/eventCache';
import { formatPassRewardSummary } from '../utils/seasonPassHelpers';
import { isNetworkOrServerSleepError } from '../services/serverReachability';
import { getCachedSnapshot, setCachedSnapshot, SNAPSHOT_KEYS } from '../services/offlineSnapshotStore';
import { executeOfflinePassClaim } from '../utils/seasonPassOffline';

export interface UseSeasonPassReturn {
    data: SeasonPassMyProgressResponse | null;
    leaderboard: SeasonPassLeaderboardResponse | null;
    loading: boolean;
    refreshing: boolean;
    loadingLeaderboard: boolean;
    claimingKey: string | null;
    refresh: (isPull?: boolean) => Promise<void>;
    loadLeaderboard: () => Promise<void>;
    unlockElite: () => Promise<void>;
    claimTier: (level: number, track: PassTrackType) => Promise<void>;
    claimAll: () => Promise<void>;
    claimQuest: (questCode: string) => Promise<void>;
    claimOvercap: () => Promise<void>;
    withdrawVault: () => Promise<void>;
}

/**
 * Custom React Hook managing Seasonal Battle Pass (Sổ Sứ Mệnh) state, SWR caching,
 * anti-double-tap action locks, and reward feedback alerts.
 */
export function useSeasonPass(): UseSeasonPassReturn {
    const { user, refreshUser } = useAuth();
    const userId = user?.id ?? user?._id;
    const cacheKey = buildEventCacheKey('season_pass_progress', userId);

    const [data, setData] = useState<SeasonPassMyProgressResponse | null>(null);
    const [leaderboard, setLeaderboard] = useState<SeasonPassLeaderboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
    const [claimingKey, setClaimingKey] = useState<string | null>(null);

    const refresh = useCallback(
        async (isPull = false) => {
            if (isPull) setRefreshing(true);
            try {
                if (!isPull && !data) {
                    const snap = await getCachedSnapshot<SeasonPassMyProgressResponse>(SNAPSHOT_KEYS.SEASON_PASS);
                    const cached = snap || (await getEventCache<SeasonPassMyProgressResponse>(cacheKey))?.data;
                    if (cached) {
                        setData(cached);
                        setLoading(false);
                    }
                }
                const fresh = await apiService.getSeasonPassProgress();
                setData(fresh);
                await Promise.all([
                    setEventCache(cacheKey, fresh),
                    setCachedSnapshot(SNAPSHOT_KEYS.SEASON_PASS, fresh),
                ]);
            } catch (err) {
                if (!isPull && !data) showApiError(err, 'Không thể tải Sổ Sứ Mệnh');
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [cacheKey, data]
    );

    useEffect(() => {
        void refresh(false);
    }, [cacheKey]);

    const runAction = useCallback(
        async (
            lockKey: string,
            actionFn: () => Promise<SeasonPassActionResponse>,
            shouldRefreshUser = true,
            offlineFallback?: () => Promise<{ updatedProgress: SeasonPassMyProgressResponse; grantedRewards: PassGrantedRewards; message: string }>
        ) => {
            if (claimingKey) return;
            setClaimingKey(lockKey);
            try {
                const res = await actionFn();
                const summary = formatPassRewardSummary(res.grantedRewards);
                Alert.alert(res.message, summary);
                await Promise.all([
                    refresh(false),
                    shouldRefreshUser ? refreshUser() : Promise.resolve(),
                ]);
            } catch (err: unknown) {
                if (isNetworkOrServerSleepError(err) && offlineFallback) {
                    try {
                        const offRes = await offlineFallback();
                        setData(offRes.updatedProgress);
                        const summary = formatPassRewardSummary(offRes.grantedRewards);
                        Alert.alert(offRes.message + ' (Đã lưu Offline)', summary);
                        return;
                    } catch (offErr: unknown) {
                        const msg = (offErr as { message?: string }).message || 'Không thể nhận quà offline';
                        Alert.alert('Lỗi', msg);
                        return;
                    }
                }
                showApiError(err, 'Thao tác Sổ Sứ Mệnh thất bại');
            } finally {
                setClaimingKey(null);
            }
        },
        [claimingKey, refresh, refreshUser]
    );

    const loadLeaderboard = useCallback(async () => {
        setLoadingLeaderboard(true);
        try {
            const res = await apiService.getSeasonPassLeaderboard(50);
            setLeaderboard(res);
        } catch (err) {
            showApiError(err, 'Không thể tải Bảng Vàng Quý');
        } finally {
            setLoadingLeaderboard(false);
        }
    }, []);

    return {
        data,
        leaderboard,
        loading,
        refreshing,
        loadingLeaderboard,
        claimingKey,
        refresh,
        loadLeaderboard,
        unlockElite: () => runAction('unlock-elite', () => apiService.unlockElitePass()),
        claimTier: (level, track) =>
            runAction(
                `tier:${track}:${level}`,
                () => apiService.claimPassTierReward(level, track),
                true,
                data ? () => executeOfflinePassClaim({ progressResponse: data, claimKind: 'tier', level, track, userId }) : undefined
            ),
        claimAll: () =>
            runAction(
                'claim-all',
                () => apiService.claimAllPassRewards(),
                true,
                data ? () => executeOfflinePassClaim({ progressResponse: data, claimKind: 'all', userId }) : undefined
            ),
        claimQuest: (questCode) =>
            runAction(
                `quest:${questCode}`,
                () => apiService.claimPassQuest(questCode),
                false,
                data ? () => executeOfflinePassClaim({ progressResponse: data, claimKind: 'quest', questCode, userId }) : undefined
            ),
        claimOvercap: () =>
            runAction(
                'claim-overcap',
                () => apiService.claimPassOvercap(),
                true,
                data ? () => executeOfflinePassClaim({ progressResponse: data, claimKind: 'overcap', userId }) : undefined
            ),
        withdrawVault: () => runAction('withdraw-vault', () => apiService.withdrawPassVault()),
    };
}

