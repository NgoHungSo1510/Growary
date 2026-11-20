import { ActiveBoss, BossRecord } from '../components/boss';
import { BossAttackResultDTO, MiniGameType, BossStatus } from '../../../shared/types/boss';
import {
    setCachedSnapshot,
    SNAPSHOT_KEYS,
} from '../services/offlineSnapshotStore';
import { enqueueOfflineAction } from '../services/offlineSyncService';
import { buildEventCacheKey, setEventCache } from './eventCache';

export interface ExecuteOfflineBossAttackParams {
    bosses: ActiveBoss[];
    records: BossRecord[];
    targetBossId: string;
    miniGameType: Exclude<MiniGameType, 'random'>;
    miniGameResult: 'critical' | 'normal';
    usePercentage: 0.25 | 0.5 | 0.75 | 1.0;
    questionIndex?: number;
    answerIndex?: number;
    userId?: string;
}

export interface OfflineBossAttackResult {
    updatedBosses: ActiveBoss[];
    updatedRecords: BossRecord[];
    attackResult: BossAttackResultDTO;
}

/**
 * Executes optimistic boss battle offline with damage overflow to sibling boss (A2 / RV-05).
 */
export async function executeOfflineBossAttack(
    params: ExecuteOfflineBossAttackParams
): Promise<OfflineBossAttackResult> {
    const {
        bosses,
        records,
        targetBossId,
        miniGameType,
        miniGameResult,
        usePercentage,
        questionIndex,
        answerIndex,
        userId,
    } = params;

    const targetIndex = bosses.findIndex((b) => b._id === targetBossId);
    if (targetIndex === -1) {
        throw new Error('Không tìm thấy nhân vật mục tiêu');
    }

    const bossA: ActiveBoss = { ...bosses[targetIndex] };
    const userRecord: BossRecord = records[targetIndex]
        ? { ...records[targetIndex] }
        : {
              totalDamageDealt: 0,
              accumulatedCoins: 0,
              attackPoints: 0,
              hasUnlockedStory: false,
          };

    if (userRecord.attackPoints <= 0) {
        throw new Error('Bạn không còn điểm tấn công');
    }

    const pointsToUse = Math.floor(userRecord.attackPoints * usePercentage);
    const multiplier = miniGameResult === 'critical' ? 1.5 : 0.75;
    const potentialDamage = Math.floor(pointsToUse * multiplier);

    // Damage to Primary Boss
    const actualDamageOnBossA = Math.min(bossA.currentHp, potentialDamage);
    bossA.currentHp = Math.max(0, bossA.currentHp - actualDamageOnBossA);
    if (bossA.currentHp === 0) {
        bossA.status = 'completed';
    }

    // Damage Overflow to Sibling Boss of current week
    const overflow = potentialDamage - actualDamageOnBossA;
    let overflowDealt = 0;
    let siblingIndex = -1;
    let bossB: ActiveBoss | null = null;

    if (overflow > 0) {
        siblingIndex = bosses.findIndex((b) => b._id !== bossA._id && b.currentHp > 0);
        if (siblingIndex !== -1) {
            bossB = { ...bosses[siblingIndex] };
            overflowDealt = Math.min(bossB.currentHp, overflow);
            bossB.currentHp = Math.max(0, bossB.currentHp - overflowDealt);
            if (bossB.currentHp === 0) {
                bossB.status = 'completed';
            }
        }
    }

    // Refund points if both bosses dead and overflow still leftover
    const leftover = overflow - overflowDealt;
    let refundPoints = 0;
    const bothDead = bossA.currentHp === 0 && (!bossB || bossB.currentHp === 0);
    if (bothDead && leftover > 0) {
        refundPoints = Math.round(leftover / multiplier);
    }

    const netPointsSpent = Math.max(0, pointsToUse - refundPoints);
    userRecord.attackPoints = Math.max(0, userRecord.attackPoints - netPointsSpent);
    userRecord.totalDamageDealt = (userRecord.totalDamageDealt || 0) + actualDamageOnBossA;

    const nextBosses = [...bosses];
    nextBosses[targetIndex] = bossA;

    const nextRecords = [...records];
    nextRecords[targetIndex] = userRecord;

    if (siblingIndex !== -1 && bossB) {
        nextBosses[siblingIndex] = bossB;
        if (nextRecords[siblingIndex]) {
            nextRecords[siblingIndex] = {
                ...nextRecords[siblingIndex],
                totalDamageDealt: (nextRecords[siblingIndex].totalDamageDealt || 0) + overflowDealt,
            };
        }
    }

    const totalDamageDealt = actualDamageOnBossA + overflowDealt;

    // Cache snapshots
    await setCachedSnapshot(SNAPSHOT_KEYS.BOSS_ACTIVE, {
        activeBosses: nextBosses,
        userRecords: nextRecords,
    });
    const payloadKey = buildEventCacheKey('active_bosses_payload', userId);
    await setEventCache(payloadKey, {
        activeBosses: nextBosses,
        userRecords: nextRecords,
    });

    // Enqueue offline action
    await enqueueOfflineAction({
        type: 'BOSS_ATTACK',
        payload: {
            bossId: targetBossId,
            pointsSpent: netPointsSpent,
            earnedDamage: totalDamageDealt,
            miniGameType,
            isCritical: miniGameResult === 'critical',
            questionIndex,
            answerIndex,
        },
        userId,
    });

    const attackResult: BossAttackResultDTO = {
        success: true,
        actualDamage: totalDamageDealt,
        overflowDamageDealt: overflowDealt > 0 ? overflowDealt : undefined,
        overflowBossId: bossB?._id,
        overflowBossTitle: bossB?.title,
        overflowBossCurrentHp: bossB?.currentHp,
        refundPoints,
        isCritical: miniGameResult === 'critical',
        bossCurrentHp: bossA.currentHp,
        bossStatus: bossA.status as BossStatus,
        userAttackPoints: userRecord.attackPoints,
        userTotalDamage: userRecord.totalDamageDealt,
        isOfflineQueued: true,
    };

    return {
        updatedBosses: nextBosses,
        updatedRecords: nextRecords,
        attackResult,
    };
}

