import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { getOfflineTaskQueue, clearOfflineTaskQueue } from '../utils/offlineQueue';
import {
    setCachedSnapshot,
    getCachedSnapshot,
    SNAPSHOT_KEYS,
    setGlobalSyncState,
} from './offlineSnapshotStore';
import type { DailyPlan, OfflineQueueItem, OfflineActionType, User } from '../types';

const OFFLINE_BATCH_QUEUE_KEY = '@growary:offline_batch_queue_v263';

function getBatchQueueKey(userId?: string): string {
    return userId
        ? `@growary:offline_batch_queue_v263_${userId}`
        : OFFLINE_BATCH_QUEUE_KEY;
}

function generateIdempotencyKey(): string {
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Đọc danh sách hành động Offline đang nằm trong hàng đợi cục bộ trên thiết bị.
 * @returns Danh sách OfflineQueueItem theo thứ tự thời gian
 */
export async function getOfflineQueue(userId?: string): Promise<OfflineQueueItem[]> {
    try {
        const key = getBatchQueueKey(userId);
        const raw = await AsyncStorage.getItem(key);
        const list: OfflineQueueItem[] = raw ? (JSON.parse(raw) as OfflineQueueItem[]) : [];

        // Gộp thêm các item từ legacy offlineTaskQueue (nếu có) để đồng bộ trong 1 batch
        const legacyTasks = await getOfflineTaskQueue();
        if (legacyTasks.length > 0) {
            for (const item of legacyTasks) {
                if (!list.some((q) => q.idempotencyKey === item.id)) {
                    list.push({
                        idempotencyKey: item.id,
                        type: item.isCompleted ? 'COMPLETE_TASK' : 'UNCOMPLETE_TASK',
                        clientTimestamp: item.queuedAt,
                        payload: {
                            planId: item.planId,
                            taskIndex: item.taskIndex,
                            proofImageUrl: item.proofImageUrl,
                            proofImageBase64: item.proofImageBase64,
                        },
                    });
                }
            }
        }

        return list;
    } catch {
        return [];
    }
}

/**
 * Lưu danh sách hàng đợi Offline xuống AsyncStorage.
 */
async function saveOfflineQueue(queue: OfflineQueueItem[], userId?: string): Promise<void> {
    try {
        const key = getBatchQueueKey(userId);
        await AsyncStorage.setItem(key, JSON.stringify(queue));
        setGlobalSyncState({ pendingCount: queue.length });
    } catch {
        // ignore storage error
    }
}

/**
 * Đưa một hành động vào hàng đợi Offline khi máy chủ ngủ đông.
 */
export async function enqueueOfflineAction(params: {
    type: OfflineActionType;
    payload: Record<string, unknown>;
    idempotencyKey?: string;
    userId?: string;
}): Promise<OfflineQueueItem> {
    const queue = await getOfflineQueue(params.userId);
    const item: OfflineQueueItem = {
        idempotencyKey: params.idempotencyKey || generateIdempotencyKey(),
        type: params.type,
        payload: params.payload,
        clientTimestamp: new Date().toISOString(),
        retries: 0,
    };
    queue.push(item);
    await saveOfflineQueue(queue, params.userId);
    return item;
}

/**
 * Áp dụng cập nhật lạc quan (Optimistic UI) lên DailyPlan trên máy khi hoàn thành task lúc Offline.
 */
export function applyOptimisticTaskToggle(
    plan: DailyPlan,
    taskIndex: number,
    isCompleted: boolean
): DailyPlan {
    const nextTasks = [...plan.tasks];
    if (nextTasks[taskIndex]) {
        nextTasks[taskIndex] = {
            ...nextTasks[taskIndex],
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
        };
    }
    return {
        ...plan,
        tasks: nextTasks,
    };
}

/**
 * Hoàn lại xu và voucher vào snapshot local khi đơn hàng offline bị từ chối (A4 / RV-13).
 */
async function handleShopRejectionRefund(action: OfflineQueueItem): Promise<void> {
    try {
        const cost = Number(action.payload.cost || 0);
        if (cost > 0) {
            const user = await getCachedSnapshot<User>(SNAPSHOT_KEYS.USER_PROFILE);
            if (user) {
                user.coins = (user.coins || 0) + cost;
                await setCachedSnapshot(SNAPSHOT_KEYS.USER_PROFILE, user);
            }
        }
    } catch {
        // ignore refund error
    }
}

/**
 * Đẩy toàn bộ hàng đợi Offline lên endpoint batch `POST /api/plans/offline-sync` khi máy chủ thức dậy.
 * Đối chiếu chi tiết từng action theo RV-02.
 */
export async function flushOfflineQueue(userId?: string): Promise<{
    syncedCount: number;
    remainingCount: number;
    latestPlan?: DailyPlan;
}> {
    const queue = await getOfflineQueue(userId);
    if (queue.length === 0) {
        setGlobalSyncState({ isSyncing: false, pendingCount: 0 });
        return { syncedCount: 0, remainingCount: 0 };
    }

    setGlobalSyncState({ isSyncing: true, pendingCount: queue.length });

    const batchToProcess = queue.slice(0, 50);
    const preparedActions: OfflineQueueItem[] = [];

    for (const item of batchToProcess) {
        const clonedPayload = { ...item.payload };
        if (
            !clonedPayload.proofImageUrl &&
            typeof clonedPayload.proofImageBase64 === 'string' &&
            clonedPayload.proofImageBase64.length > 0
        ) {
            try {
                const uploadRes = await apiService.uploadProofImage(clonedPayload.proofImageBase64);
                if (uploadRes?.url) {
                    clonedPayload.proofImageUrl = uploadRes.url;
                    delete clonedPayload.proofImageBase64;
                }
            } catch {
                // Giữ lại để thử lại ở chu kỳ sau
            }
        }
        preparedActions.push({
            ...item,
            payload: clonedPayload,
        });
    }

    try {
        const res = await apiService.post<{
            results: { idempotencyKey: string; status: string; reason?: string }[];
            latestPlan?: DailyPlan;
            user?: User;
        }>('/plans/offline-sync', {
            actions: preparedActions,
        });

        const resultMap = new Map(
            (res.results || []).map((r) => [r.idempotencyKey, r])
        );

        // RV-02: Per-item reconciliation
        const remainingQueue: OfflineQueueItem[] = [];
        let appliedCount = 0;

        for (const item of queue) {
            const result = resultMap.get(item.idempotencyKey);
            if (!result) {
                // Chưa được server xử lý trong batch này => giữ lại
                remainingQueue.push(item);
            } else if (result.status === 'applied' || result.status === 'duplicate_skipped') {
                appliedCount += 1;
            } else if (result.status === 'rejected') {
                // Bị reject do hết hàng hoặc lỗi logic => xử lý hoàn tiền nếu là shop
                if (item.type === 'PURCHASE_REWARD') {
                    await handleShopRejectionRefund(item);
                }
            }
        }

        await saveOfflineQueue(remainingQueue, userId);
        await clearOfflineTaskQueue();

        if (res.latestPlan) {
            await setCachedSnapshot(SNAPSHOT_KEYS.TODAY_PLAN, res.latestPlan);
        }
        if (res.user) {
            await setCachedSnapshot(SNAPSHOT_KEYS.USER_PROFILE, res.user);
        }

        setGlobalSyncState({
            isSyncing: false,
            pendingCount: remainingQueue.length,
            lastSyncedAt: new Date().toISOString(),
        });

        return {
            syncedCount: appliedCount,
            remainingCount: remainingQueue.length,
            latestPlan: res.latestPlan,
        };
    } catch {
        setGlobalSyncState({
            isSyncing: false,
            isOffline: true,
            pendingCount: queue.length,
        });
        return {
            syncedCount: 0,
            remainingCount: queue.length,
        };
    }
}
