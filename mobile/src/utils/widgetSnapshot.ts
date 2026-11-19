import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { DailyPlan, User } from '../types';

export const WIDGET_SNAPSHOT_STORAGE_KEY = '@growary:widget_snapshot';

export interface WidgetSnapshotData {
    date: string;
    completedCount: number;
    totalCount: number;
    streak: number;
    coins: number;
    nextTasks: { title: string; scheduledTime?: string; isCompleted: boolean }[];
    pendingSyncCount: number;
    updatedAt: string;
}

/**
 * Đọc bản chụp dữ liệu Widget gần nhất từ bộ nhớ đệm Offline trên điện thoại.
 * @returns Dữ liệu WidgetSnapshotData hoặc null nếu chưa khởi tạo
 */
export async function getWidgetSnapshot(): Promise<WidgetSnapshotData | null> {
    try {
        const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as WidgetSnapshotData;
    } catch {
        return null;
    }
}

/**
 * Đồng bộ tiến độ nhiệm vụ hôm nay, chuỗi Streak, số Xu và số mục chờ đồng bộ sang bộ nhớ Widget Android.
 * Tự động bọc an toàn để chạy mượt trên cả bản APK (EAS Build) lẫn Expo Go.
 * @param plan - Kế hoạch ngày hiện tại
 * @param user - Thông tin người chơi
 * @param pendingSyncCount - Số thao tác đang chờ đồng bộ trong offlineQueue
 * @returns Bản chụp WidgetSnapshotData vừa lưu
 */
export async function syncWidgetSnapshot(
    plan: DailyPlan | null,
    user: User | null,
    pendingSyncCount = 0
): Promise<WidgetSnapshotData> {
    const tasks = plan?.tasks || [];
    const completedCount = tasks.filter((t) => t.isCompleted).length;
    const totalCount = tasks.length;
    const nextTasks = tasks
        .filter((t) => !t.isCompleted)
        .slice(0, 3)
        .map((t) => ({
            title: t.title,
            scheduledTime: t.scheduledTime,
            isCompleted: t.isCompleted,
        }));

    const snapshot: WidgetSnapshotData = {
        date: new Date().toISOString().split('T')[0],
        completedCount,
        totalCount,
        streak: user?.currentStreak || 0,
        coins: user?.coins || 0,
        nextTasks,
        pendingSyncCount,
        updatedAt: new Date().toISOString(),
    };

    try {
        await AsyncStorage.setItem(WIDGET_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
        // ignore storage error
    }

    if (Platform.OS === 'android') {
        try {
            const dynamicRequire = Function('moduleName', 'return require(moduleName)') as (
                mod: string
            ) => { requestWidgetUpdate?: (opts: unknown) => Promise<void> };
            const widgetModule = dynamicRequire('react-native-android-widget');
            if (widgetModule && typeof widgetModule.requestWidgetUpdate === 'function') {
                await widgetModule.requestWidgetUpdate({
                    widgetName: 'GrowaryTaskWidget',
                });
            }
        } catch {
            // Chạy an toàn trên Expo Go khi native module chưa được link
        }
    }

    return snapshot;
}

