import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Thao tác hoàn thành nhiệm vụ được lưu trữ ngoại tuyến khi mất mạng hoặc server gián đoạn.
 */
export interface OfflineTaskAction {
    id: string;
    planId: string;
    taskIndex: number;
    isCompleted: boolean;
    proofImageUrl?: string;
    proofImageBase64?: string;
    queuedAt: string;
}

const OFFLINE_QUEUE_STORAGE_KEY = '@growary:offline_task_queue';

/**
 * Lấy danh sách các thao tác nhiệm vụ đang chờ đồng bộ trong AsyncStorage.
 * @returns Mảng các OfflineTaskAction theo thứ tự thời gian
 */
export async function getOfflineTaskQueue(): Promise<OfflineTaskAction[]> {
    try {
        const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as OfflineTaskAction[];
    } catch (error) {
        console.warn('Lỗi khi đọc offline task queue:', error);
        return [];
    }
}

/**
 * Lưu toàn bộ danh sách hàng đợi vào AsyncStorage.
 * @param queue - Mảng hàng đợi cần ghi đè
 */
async function saveOfflineTaskQueue(queue: OfflineTaskAction[]): Promise<void> {
    try {
        await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
        console.warn('Lỗi khi lưu offline task queue:', error);
    }
}

/**
 * Đưa một thao tác đánh dấu hoàn thành nhiệm vụ vào hàng đợi cục bộ khi mất mạng.
 * Tự động deduplicate theo cặp (planId, taskIndex).
 * @param action - Thông tin nhiệm vụ cần lưu hàng đợi
 * @returns Bản ghi OfflineTaskAction vừa được tạo hoặc cập nhật
 */
export async function enqueueOfflineTaskAction(
    action: Omit<OfflineTaskAction, 'id' | 'queuedAt'>
): Promise<OfflineTaskAction> {
    const queue = await getOfflineTaskQueue();
    const existingIndex = queue.findIndex(
        (item) => item.planId === action.planId && item.taskIndex === action.taskIndex
    );

    const fullAction: OfflineTaskAction = {
        ...action,
        id: existingIndex >= 0 ? queue[existingIndex].id : `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        queuedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        queue[existingIndex] = fullAction;
    } else {
        queue.push(fullAction);
    }

    await saveOfflineTaskQueue(queue);
    return fullAction;
}

/**
 * Xóa một hành động khỏi hàng đợi offline sau khi đã đồng bộ thành công.
 * @param actionId - ID của hành động cần xóa
 */
export async function removeOfflineTaskAction(actionId: string): Promise<void> {
    const queue = await getOfflineTaskQueue();
    const filtered = queue.filter((item) => item.id !== actionId);
    await saveOfflineTaskQueue(filtered);
}

/**
 * Xóa toàn bộ hàng đợi ngoại tuyến.
 */
export async function clearOfflineTaskQueue(): Promise<void> {
    try {
        await AsyncStorage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
    } catch (error) {
        console.warn('Lỗi khi xóa offline task queue:', error);
    }
}

/**
 * Gửi tuần tự các thao tác trong hàng đợi lên server khi có mạng trở lại.
 * @param executor - Hàm gọi API thực tế cho từng item (tự upload ảnh proof nếu có proofImageBase64)
 * @returns Số lượng thao tác đã đồng bộ thành công và số còn lại
 */
export async function flushOfflineTaskQueue(
    executor: (item: OfflineTaskAction) => Promise<unknown>
): Promise<{ syncedCount: number; remainingCount: number }> {
    const queue = await getOfflineTaskQueue();
    if (queue.length === 0) {
        return { syncedCount: 0, remainingCount: 0 };
    }

    let syncedCount = 0;
    const remaining: OfflineTaskAction[] = [];

    for (const item of queue) {
        try {
            await executor(item);
            syncedCount++;
        } catch (error: unknown) {
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            const isPermanentClientError =
                typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429;
            console.warn(`Lỗi khi sync task offline ${item.planId}#${item.taskIndex}:`, error);
            if (!isPermanentClientError) {
                remaining.push(item);
            }
        }
    }

    await saveOfflineTaskQueue(remaining);
    return { syncedCount, remainingCount: remaining.length };
}

