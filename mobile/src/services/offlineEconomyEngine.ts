import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getCachedSnapshot,
    setCachedSnapshot,
    SNAPSHOT_KEYS,
} from './offlineSnapshotStore';
import { enqueueOfflineAction } from './offlineSyncService';
import { cancelTaskNotificationsOnComplete } from './notifications';
import { DailyPlan, DailyTask, PenaltyConfig, User } from '../types';

export const PASS_TASK_XP = 12;
export const PASS_TASK_XP_DAILY_CAP = 10;

export interface OptimisticTaskRewards {
    coins: number;
    xp: number;
    isLate: boolean;
    latePercentage: number;
    attackPointsAdded: number;
}

interface PendingDeltaItem {
    coins: number;
    xp: number;
    timestamp: number;
}

const pendingDeltas = new Map<string, PendingDeltaItem>();

/**
 * Returns sum of all currently un-synced currency deltas (RV-01).
 */
export function getPendingCurrencyDeltas(): { coins: number; xp: number } {
    let coins = 0;
    let xp = 0;
    for (const delta of pendingDeltas.values()) {
        coins += delta.coins;
        xp += delta.xp;
    }
    return { coins, xp };
}

/**
 * Calculates late penalty deduction according to penalty config thresholds.
 */
function calculateTaskLatePenalty(
    task: DailyTask,
    currentTime: Date,
    penaltyConfig: PenaltyConfig | null
): { isLate: boolean; latePercentage: number } {
    if (!task.scheduledTime || !penaltyConfig?.lateThresholds?.length) {
        return { isLate: false, latePercentage: 0 };
    }

    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return { isLate: false, latePercentage: 0 };
    }

    const scheduledDate = new Date(currentTime);
    scheduledDate.setHours(hours, minutes, 0, 0);
    const duration = task.durationMinutes && task.durationMinutes > 0 ? task.durationMinutes : 15;
    scheduledDate.setMinutes(scheduledDate.getMinutes() + duration);

    const diffMinutes = Math.floor((currentTime.getTime() - scheduledDate.getTime()) / 60000);
    if (diffMinutes < 15) {
        return { isLate: false, latePercentage: 0 };
    }

    let highestDeduction = 0;
    for (const t of penaltyConfig.lateThresholds) {
        if (diffMinutes >= t.thresholdMinutes && t.deductionPercentage > highestDeduction) {
            highestDeduction = t.deductionPercentage;
        }
    }

    return {
        isLate: highestDeduction > 0,
        latePercentage: highestDeduction,
    };
}

/**
 * Applies optimistic task completion offline: calculates XP/coins with late penalty,
 * adds Boss attack points, increments Season Pass XP, manages proof photos safely,
 * and enqueues the action for background sync.
 */
export async function applyOfflineTaskCompletion(params: {
    plan: DailyPlan;
    taskIndex: number;
    proofImageBase64?: string;
    userId?: string;
}): Promise<{
    updatedPlan: DailyPlan;
    updatedUser: User | null;
    optimisticRewards: OptimisticTaskRewards;
}> {
    const { plan, taskIndex, proofImageBase64, userId } = params;
    const task = plan.tasks[taskIndex];
    if (!task) {
        throw new Error('Task not found at index');
    }

    const now = new Date();
    const penaltyConfig = await getCachedSnapshot<PenaltyConfig>(SNAPSHOT_KEYS.PENALTY_CONFIG);
    const { isLate, latePercentage } = calculateTaskLatePenalty(task, now, penaltyConfig);

    const baseCoins = task.coinReward ?? 5;
    const baseXp = task.pointsReward;
    const penaltyMultiplier = isLate ? Math.max(0, 1 - latePercentage / 100) : 1;

    const finalCoins = Math.max(1, Math.floor(baseCoins * penaltyMultiplier));
    const finalXp = Math.max(1, Math.floor(baseXp * penaltyMultiplier));
    const attackPointsAdded = finalXp;

    // Update DailyPlan
    const nextTasks = [...plan.tasks];
    nextTasks[taskIndex] = {
        ...task,
        isCompleted: true,
        completedAt: now.toISOString(),
    };
    const updatedPlan: DailyPlan = {
        ...plan,
        tasks: nextTasks,
    };
    await setCachedSnapshot(SNAPSHOT_KEYS.TODAY_PLAN, updatedPlan);

    // Update User profile snapshot
    let updatedUser = await getCachedSnapshot<User>(SNAPSHOT_KEYS.USER_PROFILE);
    if (updatedUser) {
        updatedUser = {
            ...updatedUser,
            coins: (updatedUser.coins || 0) + finalCoins,
            currentPoints: (updatedUser.currentPoints || 0) + finalXp,
            totalPointsEarned: (updatedUser.totalPointsEarned || 0) + finalXp,
        };
        await setCachedSnapshot(SNAPSHOT_KEYS.USER_PROFILE, updatedUser);
    }

    // Update Boss attack points snapshot
    const activeBosses = await getCachedSnapshot<Record<string, unknown>>(SNAPSHOT_KEYS.BOSS_ACTIVE);
    if (activeBosses && Array.isArray((activeBosses as { userRecords?: { attackPoints: number }[] }).userRecords)) {
        for (const record of (activeBosses as { userRecords: { attackPoints: number }[] }).userRecords) {
            record.attackPoints = (record.attackPoints || 0) + attackPointsAdded;
        }
        await setCachedSnapshot(SNAPSHOT_KEYS.BOSS_ACTIVE, activeBosses);
    }

    // Update Season Pass snapshot (RV-06: 12 XP per task, cap at 10)
    const cachedPass = await getCachedSnapshot<Record<string, unknown>>(SNAPSHOT_KEYS.SEASON_PASS);
    if (cachedPass && typeof cachedPass === 'object') {
        const passObj = cachedPass as {
            myProgress?: {
                dailyTasksCompletedToday?: number;
                currentXp?: number;
                currentLevel?: number;
            };
        };
        if (passObj.myProgress) {
            const count = passObj.myProgress.dailyTasksCompletedToday || 0;
            if (count < PASS_TASK_XP_DAILY_CAP) {
                passObj.myProgress.dailyTasksCompletedToday = count + 1;
                passObj.myProgress.currentXp = (passObj.myProgress.currentXp || 0) + PASS_TASK_XP;
                await setCachedSnapshot(SNAPSHOT_KEYS.SEASON_PASS, passObj);
            }
        }
    }

    // Manage proof image under separate storage key (RV-07)
    const idempotencyKey = `idem_task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    if (proofImageBase64) {
        const proofKey = `@growary:offline_proof:${userId || 'default'}:${idempotencyKey}`;
        await AsyncStorage.setItem(proofKey, proofImageBase64).catch(() => {});
    }

    // Record pending delta
    pendingDeltas.set(idempotencyKey, {
        coins: finalCoins,
        xp: finalXp,
        timestamp: Date.now(),
    });

    // Enqueue offline action
    await enqueueOfflineAction({
        type: 'COMPLETE_TASK',
        idempotencyKey,
        payload: {
            planId: plan._id,
            taskIndex,
            proofImageBase64,
        },
        userId,
    });

    // Cancel notification for this task
    await cancelTaskNotificationsOnComplete(task._id);

    return {
        updatedPlan,
        updatedUser,
        optimisticRewards: {
            coins: finalCoins,
            xp: finalXp,
            isLate,
            latePercentage,
            attackPointsAdded,
        },
    };
}

/**
 * Updates cached user currency directly from offline engine events.
 */
export async function applyOfflineCurrencyDelta(delta: {
    coinsDelta?: number;
    xpDelta?: number;
    ticketsDelta?: number;
}): Promise<User | null> {
    const user = await getCachedSnapshot<User>(SNAPSHOT_KEYS.USER_PROFILE);
    if (!user) return null;

    const updated: User = {
        ...user,
        coins: Math.max(0, (user.coins || 0) + (delta.coinsDelta || 0)),
        currentPoints: Math.max(0, (user.currentPoints || 0) + (delta.xpDelta || 0)),
        gachaTickets: Math.max(0, (user.gachaTickets || 0) + (delta.ticketsDelta || 0)),
    };

    await setCachedSnapshot(SNAPSHOT_KEYS.USER_PROFILE, updated);
    return updated;
}
