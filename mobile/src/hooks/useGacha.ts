import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GachaItem, GachaWeeklyEvent, GachaLeaderboardResponse } from '@shared';
import { getCachedSnapshot, setCachedSnapshot, SNAPSHOT_KEYS } from '../services/offlineSnapshotStore';
import { enqueueOfflineAction } from '../services/offlineSyncService';
import { applyOfflineCurrencyDelta } from '../services/offlineEconomyEngine';
import { isNetworkOrServerSleepError } from '../services/serverReachability';

export interface CountdownState {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    totalMs: number;
}

/**
 * Calculates remaining time until Sunday 23:59:59 Vietnam time (UTC+7).
 */
export function getRemainingTimeUntilSundayVN(): { totalMs: number; days: number; hours: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    // Offset to UTC+7
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const day = vnNow.getUTCDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const daysUntilSunday = day === 0 ? 0 : 7 - day;

    const sundayEnd = new Date(vnNow);
    sundayEnd.setUTCDate(vnNow.getUTCDate() + daysUntilSunday);
    sundayEnd.setUTCHours(23, 59, 59, 999);

    const totalMs = Math.max(0, sundayEnd.getTime() - vnNow.getTime());
    const totalSeconds = Math.floor(totalMs / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = days > 0
        ? `${days} ngày ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return { totalMs, days, hours, minutes, seconds, formatted };
}

export function useGacha() {
    const { user, refreshUser } = useAuth();
    const [items, setItems] = useState<GachaItem[]>([]);
    const [currentTier, setCurrentTier] = useState<number>(1);
    const [weeklyEvent, setWeeklyEvent] = useState<GachaWeeklyEvent | null>(null);
    const [leaderboard, setLeaderboard] = useState<GachaLeaderboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [spinning, setSpinning] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<CountdownState>(getRemainingTimeUntilSundayVN());
    const [isUrgent, setIsUrgent] = useState<boolean>(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Real-time countdown timer
    useEffect(() => {
        const updateTimer = () => {
            const rem = getRemainingTimeUntilSundayVN();
            setCountdown(rem);
            // Urgent when remaining time is 1 hour (3600s = 3,600,000ms) or less
            setIsUrgent(rem.totalMs <= 3600 * 1000 && rem.totalMs > 0);
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const fetchGachaData = useCallback(async (options?: { silent?: boolean }) => {
        try {
            if (!options?.silent && items.length === 0) {
                const cached = await getCachedSnapshot<{
                    items: GachaItem[];
                    currentTier: number;
                    weeklyEvent: GachaWeeklyEvent | null;
                    leaderboard: GachaLeaderboardResponse | null;
                }>(SNAPSHOT_KEYS.GACHA_DATA);
                if (cached) {
                    if (cached.items) setItems(cached.items);
                    if (cached.currentTier) setCurrentTier(cached.currentTier);
                    if (cached.weeklyEvent) setWeeklyEvent(cached.weeklyEvent);
                    if (cached.leaderboard) setLeaderboard(cached.leaderboard);
                    setLoading(false);
                } else {
                    setLoading(true);
                }
            }
            const [itemsRes, eventRes, leaderboardRes] = await Promise.allSettled([
                apiService.getGachaItems(),
                apiService.getGachaWeeklyEvent(),
                apiService.getGachaLeaderboard(),
            ]);

            let nextItems = items;
            let nextTier = currentTier;
            let nextEvent = weeklyEvent;
            let nextLeaderboard = leaderboard;

            if (itemsRes.status === 'fulfilled' && itemsRes.value) {
                nextItems = itemsRes.value.items || [];
                nextTier = itemsRes.value.currentTier || 1;
                setItems(nextItems);
                setCurrentTier(nextTier);
            }

            if (eventRes.status === 'fulfilled' && eventRes.value) {
                nextEvent = eventRes.value.event || null;
                setWeeklyEvent(nextEvent);
            }

            if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value) {
                nextLeaderboard = leaderboardRes.value;
                setLeaderboard(nextLeaderboard);
            }

            await setCachedSnapshot(SNAPSHOT_KEYS.GACHA_DATA, {
                items: nextItems,
                currentTier: nextTier,
                weeklyEvent: nextEvent,
                leaderboard: nextLeaderboard,
            });
        } catch (error) {
            console.error('Error fetching gacha data:', error);
        } finally {
            setLoading(false);
        }
    }, [items, currentTier, weeklyEvent, leaderboard]);

    useEffect(() => {
        fetchGachaData();
    }, [fetchGachaData]);

    const spin = async () => {
        if (spinning) return null;
        try {
            setSpinning(true);
            let result: any;
            try {
                result = await apiService.spinGacha();
            } catch (err: unknown) {
                if (isNetworkOrServerSleepError(err)) {
                    if ((user?.gachaTickets ?? 0) < 1) {
                        throw new Error('Bạn không có đủ vé Gacha để quay');
                    }
                    if (items.length === 0) {
                        throw new Error('Chưa có danh sách vật phẩm gacha');
                    }
                    const totalProb = items.reduce((acc, it) => acc + (it.probability || 1), 0);
                    let rand = Math.random() * totalProb;
                    let selected = items[0];
                    for (const it of items) {
                        rand -= (it.probability || 1);
                        if (rand <= 0) {
                            selected = it;
                            break;
                        }
                    }

                    await applyOfflineCurrencyDelta({ ticketsDelta: -1 });
                    const coinsWon = selected.type === 'coins' ? (selected.rewardAmount || 0) : 0;
                    const xpWon = selected.type === 'exp' ? (selected.rewardAmount || 0) : 0;
                    if (coinsWon > 0 || xpWon > 0) {
                        await applyOfflineCurrencyDelta({ coinsDelta: coinsWon, xpDelta: xpWon });
                    }

                    await enqueueOfflineAction({
                        type: 'GACHA_OFFLINE_SPIN',
                        payload: {
                            count: 1,
                            wonItemId: selected._id,
                            wonItemName: selected.name,
                            rarity: selected.rarity,
                        },
                        userId: user?._id,
                    });

                    result = {
                        success: true,
                        wonItem: selected,
                        tierUpgraded: false,
                        scoreGained: 10,
                        newStats: {
                            coins: (user?.coins || 0) + coinsWon,
                            xp: (user?.currentPoints || 0) + xpWon,
                            gachaTickets: Math.max(0, (user?.gachaTickets || 0) - 1),
                            gachaTier: currentTier,
                        },
                    };
                } else {
                    throw err;
                }
            }

            if (result && result.newStats) {
                if (result.newStats.gachaTier && result.newStats.gachaTier !== currentTier) {
                    setCurrentTier(result.newStats.gachaTier);
                }
                if (refreshUser) {
                    void refreshUser();
                }
            }
            // Refresh leaderboard to reflect newly earned points
            apiService.getGachaLeaderboard().then((res) => {
                if (res) setLeaderboard(res);
            }).catch(() => {});

            return result;
        } catch (error) {
            console.error('Spin gacha failed:', error);
            throw error;
        } finally {
            setSpinning(false);
        }
    };

    const refreshLeaderboard = useCallback(async () => {
        try {
            const res = await apiService.getGachaLeaderboard();
            if (res) setLeaderboard(res);
        } catch (error) {
            console.error('Refresh leaderboard failed:', error);
        }
    }, []);

    return {
        items,
        currentTier,
        weeklyEvent,
        leaderboard,
        loading,
        spinning,
        countdown,
        isUrgent,
        spin,
        fetchGachaData,
        refreshLeaderboard,
        userTickets: user?.gachaTickets ?? 0,
    };
}
