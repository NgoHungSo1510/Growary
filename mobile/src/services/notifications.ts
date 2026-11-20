import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DailyTask, NotificationConfig, AccountNotificationItem } from '../types';

export const ANDROID_REMINDER_CHANNEL_ID = 'growary-reminders-v2';
export const CACHED_NOTIFICATION_CONFIGS_KEY = '@growary:cached_notification_configs';
const ANNOUNCED_SERVER_NOTIF_IDS_KEY = '@growary:announced_notif_ids';
const MAX_SCHEDULED_NOTIFICATIONS = 45; // RV-17: safe headroom below iOS/Android 64-limit

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Thiết lập kênh thông báo mức ưu tiên cao nhất cho Android 8+ và kiểm tra/xin quyền thông báo.
 */
export async function ensureNotificationChannelAndPermissions(): Promise<{
    granted: boolean;
    channelReady: boolean;
}> {
    if (Platform.OS === 'web') {
        return { granted: false, channelReady: false };
    }

    let channelReady = true;
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync(ANDROID_REMINDER_CHANNEL_ID, {
                name: 'Nhắc nhở Nhiệm vụ & Sự kiện Growary',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
                enableVibrate: true,
            });
        } catch {
            channelReady = false;
        }
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return {
        granted: finalStatus === 'granted',
        channelReady,
    };
}

export async function requestNotificationPermissions(): Promise<boolean> {
    const res = await ensureNotificationChannelAndPermissions();
    return res.granted;
}

export async function cacheNotificationConfigs(configs: NotificationConfig[]): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHED_NOTIFICATION_CONFIGS_KEY, JSON.stringify(configs));
    } catch {
        // ignore storage error
    }
}

export async function getCachedNotificationConfigs(): Promise<NotificationConfig[]> {
    try {
        const raw = await AsyncStorage.getItem(CACHED_NOTIFICATION_CONFIGS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as NotificationConfig[];
    } catch {
        return [];
    }
}

/**
 * Hủy các thông báo đang hẹn của một nhiệm vụ khi nhiệm vụ được nộp hoàn thành.
 */
export async function cancelTaskNotificationsOnComplete(taskId?: string): Promise<void> {
    if (Platform.OS === 'web' || !taskId) return;
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.taskId === taskId) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
            }
        }
    } catch {
        // ignore
    }
}

/**
 * Lập lịch thông báo 3 mốc thời gian (Nhắc trước, Đúng giờ, Báo quá hạn) cho một nhiệm vụ đơn lẻ.
 */
export async function scheduleQuestTimelineNotifications(
    task: DailyTask,
    leadMinutes = 15
): Promise<string[]> {
    if (Platform.OS === 'web') return [];
    if (!task.scheduledTime || task.isCompleted) return [];

    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return [];

    const now = Date.now();
    const scheduledIds: string[] = [];

    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const preReminderDate = new Date(startDate.getTime() - leadMinutes * 60000);
    const durationMinutes = task.durationMinutes && task.durationMinutes > 0 ? task.durationMinutes : 15;
    const overdueDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // Mốc 1: Nhắc trước giờ làm
    if (preReminderDate.getTime() > now) {
        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Sắp tới giờ nhiệm vụ!',
                    body: `Nhiệm vụ "${task.title}" sẽ bắt đầu lúc ${task.scheduledTime}. Chuẩn bị hoàn thành đúng giờ để nhận 100% thưởng nhé!`,
                    sound: true,
                    data: { taskId: task._id, type: 'pre_reminder' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: preReminderDate,
                    ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
                },
            });
            scheduledIds.push(id);
        } catch {
            // ignore
        }
    }

    // Mốc 2: Báo đúng giờ bắt đầu
    if (startDate.getTime() > now) {
        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🚀 Đã tới giờ làm nhiệm vụ!',
                    body: `Đến giờ thực hiện "${task.title}" (${task.scheduledTime}) rồi. Bắt đầu ngay thôi!`,
                    sound: true,
                    data: { taskId: task._id, type: 'start_time' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: startDate,
                    ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
                },
            });
            scheduledIds.push(id);
        } catch {
            // ignore
        }
    }

    // Mốc 3: Báo quá hạn (Overdue)
    if (overdueDate.getTime() > now) {
        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⚠️ Nhiệm vụ đã quá hạn!',
                    body: `Nhiệm vụ "${task.title}" (hẹn lúc ${task.scheduledTime}) đã quá hạn! Hãy vào app xác nhận hoàn thành ngay trước khi bị trừ thêm điểm phạt trễ hạn!`,
                    sound: true,
                    data: { taskId: task._id, type: 'overdue' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: overdueDate,
                    ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
                },
            });
            scheduledIds.push(id);
        } catch {
            // ignore
        }
    } else if (now > overdueDate.getTime() && now - overdueDate.getTime() < 2 * 3600 * 1000) {
        // Mở app khi nhiệm vụ vừa quá hạn trong 2 tiếng qua
        const todayStr = new Date().toISOString().split('T')[0];
        const key = `@growary:announced_overdue_task_ids_${todayStr}`;
        try {
            const raw = await AsyncStorage.getItem(key);
            const announced = raw ? (JSON.parse(raw) as string[]) : [];
            if (task._id && !announced.includes(task._id)) {
                announced.push(task._id);
                await AsyncStorage.setItem(key, JSON.stringify(announced));
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: '⚠️ Nhiệm vụ đã quá hạn!',
                        body: `Nhiệm vụ "${task.title}" (hẹn lúc ${task.scheduledTime}) đã quá hạn! Hãy xác nhận ngay nhé!`,
                        sound: true,
                        data: { taskId: task._id, type: 'overdue_instant' },
                    },
                    trigger: null,
                });
            }
        } catch {
            // ignore
        }
    }

    return scheduledIds;
}

/**
 * Hủy toàn bộ lịch nhắc đã hẹn trên thiết bị.
 */
export async function cancelAllQuestReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Đặt lại toàn bộ lịch nhắc nhiệm vụ trong ngày (3 mốc Timeline) + Offline Alarm cố định (21:30 & config).
 */
export async function scheduleAllQuestReminders(
    tasks: DailyTask[],
    configsOverride?: NotificationConfig[]
): Promise<number> {
    if (Platform.OS === 'web') return 0;

    const { granted } = await ensureNotificationChannelAndPermissions();
    if (!granted) return 0;

    await cancelAllQuestReminders();

    const configs = configsOverride ?? (await getCachedNotificationConfigs());
    const activeDailyConfigs = configs.filter((c) => c.isActive && c.targetType === 'daily');
    const leadMinutes =
        activeDailyConfigs.length > 0 ? Math.max(5, activeDailyConfigs[0].triggerBeforeMinutes) : 15;

    let scheduledCount = 0;

    for (const task of tasks) {
        if (scheduledCount >= MAX_SCHEDULED_NOTIFICATIONS - 5) break;
        const ids = await scheduleQuestTimelineNotifications(task, leadMinutes);
        scheduledCount += ids.length;
    }

    // Luôn đặt Offline Alarm lặp hằng ngày lúc 21:30 để chạy cả khi Server ngủ đông
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔥 Kiểm tra chuỗi Streak & Nhiệm vụ hôm nay!',
                body: 'Còn 2 tiếng rưỡi trước khi khóa sổ ngày (24:00). Hãy hoàn thành nhiệm vụ để giữ chuỗi Streak nhé!',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 21,
                minute: 30,
                ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
            },
        });
        scheduledCount++;
    } catch {
        // ignore
    }

    for (const cfg of activeDailyConfigs) {
        if (scheduledCount >= MAX_SCHEDULED_NOTIFICATIONS) break;
        const totalMinsBeforeMidnight = Math.min(360, Math.max(5, cfg.triggerBeforeMinutes));
        const targetMinuteOfDay = 24 * 60 - totalMinsBeforeMidnight;
        const alarmHour = Math.floor(targetMinuteOfDay / 60);
        const alarmMinute = targetMinuteOfDay % 60;

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: cfg.title,
                    body: cfg.message,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: alarmHour,
                    minute: alarmMinute,
                    ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
                },
            });
            scheduledCount++;
        } catch {
            // ignore
        }
    }

    return scheduledCount;
}

/**
 * Hiển thị các thông báo mới chưa đọc từ hộp thư Account thành Local Notification.
 */
export async function announceUnreadServerNotifications(
    notifications: Pick<AccountNotificationItem, '_id' | 'title' | 'message' | 'isRead'>[]
): Promise<void> {
    if (Platform.OS === 'web') return;
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    const { granted } = await ensureNotificationChannelAndPermissions();
    if (!granted) return;

    let announcedIds: string[] = [];
    try {
        const raw = await AsyncStorage.getItem(ANNOUNCED_SERVER_NOTIF_IDS_KEY);
        if (raw) announcedIds = JSON.parse(raw) as string[];
    } catch {
        announcedIds = [];
    }

    const seenSet = new Set(announcedIds);
    let hasNew = false;

    for (const item of unread.slice(0, 3)) {
        if (seenSet.has(item._id)) continue;
        seenSet.add(item._id);
        hasNew = true;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: item.title,
                body: item.message,
                sound: true,
            },
            trigger: null,
        }).catch(() => undefined);
    }

    if (hasNew) {
        const recentIds = Array.from(seenSet).slice(-100);
        await AsyncStorage.setItem(ANNOUNCED_SERVER_NOTIF_IDS_KEY, JSON.stringify(recentIds)).catch(
            () => undefined
        );
    }
}

/**
 * Gửi một thông báo thử nghiệm sau 5 giây để kiểm tra kênh thông báo.
 */
export async function triggerTestNotificationIn5Seconds(): Promise<string> {
    const { granted } = await ensureNotificationChannelAndPermissions();
    if (!granted) {
        throw new Error('Chưa cấp quyền thông báo cho ứng dụng Growary');
    }

    return Notifications.scheduleNotificationAsync({
        content: {
            title: '🔔 Kiểm tra thông báo Growary thành công!',
            body: 'Kênh thông báo Offline Alarm (growary-reminders-v2) đang hoạt động tốt ngay cả khi máy chủ ngủ đông.',
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
            repeats: false,
            ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
        },
    });
}

/**
 * Lấy thông tin chẩn đoán trạng thái thông báo đang hẹn trên máy.
 */
export async function getScheduledNotificationsDiagnostics(): Promise<{
    permissionStatus: string;
    channelId: string;
    scheduledCount: number;
    cachedRulesCount: number;
    sampleTitles: string[];
}> {
    if (Platform.OS === 'web') {
        return {
            permissionStatus: 'unsupported_web',
            channelId: ANDROID_REMINDER_CHANNEL_ID,
            scheduledCount: 0,
            cachedRulesCount: 0,
            sampleTitles: [],
        };
    }

    const [perm, scheduled, cachedConfigs] = await Promise.all([
        Notifications.getPermissionsAsync(),
        Notifications.getAllScheduledNotificationsAsync(),
        getCachedNotificationConfigs(),
    ]);

    return {
        permissionStatus: perm.status,
        channelId: ANDROID_REMINDER_CHANNEL_ID,
        scheduledCount: scheduled.length,
        cachedRulesCount: cachedConfigs.length,
        sampleTitles: scheduled
            .slice(0, 5)
            .map((item) => item.content.title || 'Nhắc nhở Growary'),
    };
}
