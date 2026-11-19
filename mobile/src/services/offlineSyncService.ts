import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { getOfflineTaskQueue, clearOfflineTaskQueue } from '../utils/offlineQueue';
import type { DailyPlan, OfflineQueueItem, OfflineActionType } from '../types';

const OFFLINE_BATCH_QUEUE_KEY = '@growary:offline_batch_queue_v263';

function generateIdempotencyKey(): string {
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Đọc danh sách hành động Offline đang nằm trong hàng đợi cục bộ trên thiết bị.
 * @returns Danh sách OfflineQueueItem theo thứ tự thời gian
 */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
        const raw = await AsyncStorage.getItem(OFFLINE_BATCH_QUEUE_KEY);
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
 * @param queue - Mảng OfflineQueueItem cần lưu
 */
async function saveOfflineQueue(queue: OfflineQueueItem[]): Promise<void> {
    try {
        await AsyncStorage.setItem(OFFLINE_BATCH_QUEUE_KEY, JSON.stringify(queue));
    } catch {
        // ignore storage error
    }
}

/**
 * Đưa một hành động (Hoàn thành task / Tạo custom task / Lưu nhật ký) vào hàng đợi Offline khi máy chủ ngủ đông.
 * @param params - Loại hành động và payload chi tiết
 * @returns Bản ghi OfflineQueueItem vừa tạo
 */
export async function enqueueOfflineAction(params: {
    type: OfflineActionType;
    payload: Record<string, unknown>;
    idempotencyKey?: string;
}): Promise<OfflineQueueItem> {
    const queue = await getOfflineQueue();
    const item: OfflineQueueItem = {
        idempotencyKey: params.idempotencyKey || generateIdempotencyKey(),
        type: params.type,
        payload: params.payload,
        clientTimestamp: new Date().toISOString(),
        retries: 0,
    };
    queue.push(item);
    await saveOfflineQueue(queue);
    return item;
}

/**
 * Áp dụng cập nhật lạc quan (Optimistic UI) lên DailyPlan trên máy khi hoàn thành task lúc Offline.
 * @param plan - DailyPlan hiện tại trên máy
 * @param taskIndex - Chỉ số task trong mảng
 * @param isCompleted - Trạng thái hoàn thành mới
 * @returns Bản sao DailyPlan đã cập nhật
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
 * Đẩy toàn bộ hàng đợi Offline lên endpoint batch `POST /api/plans/offline-sync` khi máy chủ thức dậy.
 * @returns Số lượng hành động đã đồng bộ thành công và số còn lại
 */
export async function flushOfflineQueue(): Promise<{
    syncedCount: number;
    remainingCount: number;
    latestPlan?: DailyPlan;
}> {
    const queue = await getOfflineQueue();
    if (queue.length === 0) {
        return { syncedCount: 0, remainingCount: 0 };
    }

    const preparedActions: OfflineQueueItem[] = [];
    for (const item of queue) {
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
                // Giữ nguyên để thử lại ở chu kỳ sau nếu server chưa thức hẳn
            }
        }
        preparedActions.push({
            ...item,
            payload: clonedPayload,
        });
    }

    try {
        const res = await apiService.post<{
            results: { idempotencyKey: string; status: string }[];
            latestPlan?: DailyPlan;
        }>('/plans/offline-sync', {
            actions: preparedActions.slice(0, 50),
        });

        await saveOfflineQueue(preparedActions.slice(50));
        await clearOfflineTaskQueue();

        if (res.latestPlan) {
            await AsyncStorage.setItem(
                '@growary:cached_today_plan',
                JSON.stringify(res.latestPlan)
            ).catch(() => undefined);
        }

        return {
            syncedCount: res.results?.length || preparedActions.length,
            remainingCount: Math.max(0, preparedActions.length - 50),
            latestPlan: res.latestPlan,
        };
    } catch {
        return {
            syncedCount: 0,
            remainingCount: queue.length,
        };
    }
}

