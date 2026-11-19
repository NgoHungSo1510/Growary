import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DailyTask, NotificationConfig, AccountNotificationItem } from '../types';

export const ANDROID_REMINDER_CHANNEL_ID = 'growary-reminders-v2';
export const CACHED_NOTIFICATION_CONFIGS_KEY = '@growary:cached_notification_configs';
const ANNOUNCED_SERVER_NOTIF_IDS_KEY = '@growary:announced_notif_ids';

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
 * @returns Trạng thái quyền thông báo và kênh Android đã sẵn sàng hay chưa
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

/**
 * Yêu cầu quyền thông báo trên thiết bị (giữ tương thích ngược với các màn hình hiện có).
 * @returns true nếu quyền đã được cấp
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    const res = await ensureNotificationChannelAndPermissions();
    return res.granted;
}

/**
 * Lưu danh sách quy tắc NotificationConfig của Admin vào bộ nhớ đệm Offline trên điện thoại.
 * @param configs - Danh sách quy tắc NotificationConfig đang hoạt động
 */
export async function cacheNotificationConfigs(configs: NotificationConfig[]): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHED_NOTIFICATION_CONFIGS_KEY, JSON.stringify(configs));
    } catch {
        // ignore storage error
    }
}

/**
 * Đọc danh sách quy tắc NotificationConfig từ bộ nhớ đệm Offline trên điện thoại.
 * @returns Danh sách NotificationConfig đã lưu
 */
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
 * Lập lịch nhắc nhở trước hạn cho một nhiệm vụ đơn lẻ.
 * @param task - Nhiệm vụ cần nhắc
 * @param leadMinutes - Số phút báo trước giờ hẹn (mặc định 30 phút)
 * @returns ID lịch thông báo hoặc null nếu đã qua giờ
 */
export async function scheduleQuestReminder(
    task: DailyTask,
    leadMinutes = 30
): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    if (!task.scheduledTime || task.isCompleted) return null;

    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    scheduledDate.setMinutes(scheduledDate.getMinutes() - leadMinutes);

    if (scheduledDate.getTime() <= Date.now()) {
        return null;
    }

    return Notifications.scheduleNotificationAsync({
        content: {
            title: '⏰ Sắp tới giờ nhiệm vụ!',
            body: `Nhiệm vụ "${task.title}" sẽ bắt đầu sau ${leadMinutes} phút (lúc ${task.scheduledTime}). Hoàn thành đúng giờ để nhận 100% thưởng nhé!`,
            sound: true,
            data: { taskId: task._id },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledDate,
            ...(Platform.OS === 'android' ? { channelId: ANDROID_REMINDER_CHANNEL_ID } : {}),
        },
    });
}

/**
 * Hủy toàn bộ lịch nhắc đã hẹn trên thiết bị.
 */
export async function cancelAllQuestReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Đặt lại toàn bộ lịch nhắc nhiệm vụ trong ngày + Offline Alarm cố định hằng ngày (21:30 & theo NotificationConfig).
 * @param tasks - Danh sách nhiệm vụ hôm nay
 * @param configsOverride - Danh sách NotificationConfig (nếu không truyền sẽ tự đọc từ cache)
 * @returns Tổng số lịch thông báo đã hẹn thành công
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
        activeDailyConfigs.length > 0 ? Math.max(5, activeDailyConfigs[0].triggerBeforeMinutes) : 30;

    let scheduledCount = 0;

    for (const task of tasks) {
        const id = await scheduleQuestReminder(task, leadMinutes);
        if (id) scheduledCount++;
    }

    // R12: Luôn đặt lại Offline Alarm lặp hằng ngày lúc 21:30 sau khi cancelAll để chạy cả khi Server ngủ đông
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
        // ignore if platform does not support repeating daily trigger
    }

    for (const cfg of activeDailyConfigs) {
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
 * Hiển thị các thông báo mới chưa đọc từ hộp thư Account thành Local Notification trên thanh trạng thái điện thoại.
 * @param notifications - Danh sách thông báo từ máy chủ
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
 * Gửi một thông báo thử nghiệm sau 5 giây để người dùng kiểm tra trực tiếp trên máy Android.
 * @returns ID lịch hẹn thử nghiệm
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
 * Lấy thông tin chẩn đoán trạng thái quyền, kênh thông báo và số lượng lịch hẹn đang lưu trên máy.
 * @returns Đối tượng chẩn đoán hiển thị trong NotificationDiagnosticsModal
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
