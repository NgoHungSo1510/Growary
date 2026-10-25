import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GachaItem, GachaWeeklyEvent, GachaLeaderboardResponse } from '@shared';

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

    const fetchGachaData = useCallback(async () => {
        try {
            setLoading(true);
            const [itemsRes, eventRes, leaderboardRes] = await Promise.allSettled([
                apiService.getGachaItems(),
                apiService.getGachaWeeklyEvent(),
                apiService.getGachaLeaderboard(),
            ]);

            if (itemsRes.status === 'fulfilled' && itemsRes.value) {
                setItems(itemsRes.value.items || []);
                setCurrentTier(itemsRes.value.currentTier || 1);
            }

            if (eventRes.status === 'fulfilled' && eventRes.value) {
                setWeeklyEvent(eventRes.value.event || null);
            }

            if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value) {
                setLeaderboard(leaderboardRes.value);
            }
        } catch (error) {
            console.error('Error fetching gacha data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGachaData();
    }, [fetchGachaData]);

    const spin = async () => {
        if (spinning) return null;
        try {
            setSpinning(true);
            const result = await apiService.spinGacha();
            if (result && result.newStats && refreshUser) {
                await refreshUser();
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
