import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
    getOfflineQueue,
    flushOfflineQueue,
    enqueueOfflineAction,
} from '../services/offlineSyncService';
import type { DailyPlan, OfflineActionType } from '../types';

export interface UseOfflineSyncReturn {
    pendingCount: number;
    isSyncing: boolean;
    refreshQueueCount: () => Promise<number>;
    flushNow: () => Promise<DailyPlan | undefined>;
    queueAction: (type: OfflineActionType, payload: Record<string, unknown>) => Promise<void>;
}

/**
 * Custom Hook quản lý hàng đợi thao tác Offline và tự động đồng bộ khi máy chủ Render thức dậy.
 * @param onPlanSynced - Callback nhận DailyPlan mới nhất từ server sau khi đồng bộ batch thành công
 * @returns Trạng thái số mục chờ đồng bộ, cờ đang đồng bộ và các hàm thao tác
 */
export function useOfflineSync(
    onPlanSynced?: (latestPlan: DailyPlan) => void
): UseOfflineSyncReturn {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const refreshQueueCount = useCallback(async (): Promise<number> => {
        const queue = await getOfflineQueue();
        setPendingCount(queue.length);
        return queue.length;
    }, []);

    const flushNow = useCallback(async (): Promise<DailyPlan | undefined> => {
        const currentCount = await refreshQueueCount();
        if (currentCount === 0) return undefined;

        setIsSyncing(true);
        try {
            const res = await flushOfflineQueue();
            setPendingCount(res.remainingCount);
            if (res.latestPlan && onPlanSynced) {
                onPlanSynced(res.latestPlan);
            }
            return res.latestPlan;
        } finally {
            setIsSyncing(false);
        }
    }, [refreshQueueCount, onPlanSynced]);

    const queueAction = useCallback(
        async (type: OfflineActionType, payload: Record<string, unknown>): Promise<void> => {
            await enqueueOfflineAction({ type, payload });
            await refreshQueueCount();
        },
        [refreshQueueCount]
    );

    useEffect(() => {
        void refreshQueueCount();

        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                void flushNow();
            }
        });

        const interval = setInterval(() => {
            void flushNow();
        }, 45000);

        return () => {
            sub.remove();
            clearInterval(interval);
        };
    }, [refreshQueueCount, flushNow]);

    return {
        pendingCount,
        isSyncing,
        refreshQueueCount,
        flushNow,
        queueAction,
    };
}

