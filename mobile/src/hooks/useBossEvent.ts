import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { getErrorMessage, showApiError } from '../utils/errorHandler';

export interface ActiveBoss {
    _id: string;
    title: string;
    description: string;
    totalHp: number;
    currentHp: number;
    startDate: string;
    endDate: string;
    status: string;
    avatarImageUrl?: string;
    loreTitle?: string;
    loreContent?: string;
    isLimited?: boolean;
    miniGameType?: string;
    miniGameQuestions?: Array<{ question: string; options: string[]; correctIndex: number }>;
    collectionId?: string;
    [key: string]: any;
}

export interface BossRecord {
    totalDamageDealt: number;
    accumulatedCoins: number;
    attackPoints: number;
    hasUnlockedStory: boolean;
}

export function useBossEvent(targetBossId?: string) {
    const [bosses, setBosses] = useState<ActiveBoss[]>([]);
    const [records, setRecords] = useState<BossRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBosses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiService.get('/events/boss/active');
            if (res.activeBosses && res.activeBosses.length > 0) {
                let activeBosses: ActiveBoss[] = res.activeBosses;
                let userRecords: BossRecord[] = res.userRecords || [];

                if (targetBossId) {
                    const idx = activeBosses.findIndex((b) => b._id === targetBossId);
                    if (idx !== -1) {
                        activeBosses = [activeBosses[idx]];
                        userRecords = [userRecords[idx]];
                    }
                }

                setBosses(activeBosses);
                setRecords(userRecords);
            } else {
                setBosses([]);
                setRecords([]);
            }
        } catch (err: unknown) {
            const msg = getErrorMessage(err);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [targetBossId]);

    useEffect(() => {
        fetchBosses();
    }, [fetchBosses]);

    const attackBoss = async (
        bossId: string,
        scoreMultiplier: number,
        attackPercentage: number,
        answers?: Array<{ questionIndex: number; selectedIndex: number }>
    ) => {
        try {
            const res = await apiService.post('/events/boss/attack', {
                bossId,
                scoreMultiplier,
                attackPercentage,
                answers,
            });
            await fetchBosses();
            return res;
        } catch (err: unknown) {
            showApiError(err, 'Tấn công thất bại');
            return null;
        }
    };

    return {
        bosses,
        records,
        loading,
        error,
        refreshBosses: fetchBosses,
        attackBoss,
    };
}
