import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DailyTask } from '../types';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    return finalStatus === 'granted';
}

export async function scheduleQuestReminder(task: DailyTask): Promise<string | null> {
    if (!task.scheduledTime) return null;
    if (task.isCompleted) return null;

    const [hours, minutes] = task.scheduledTime.split(':').map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Reminder 30 minutes before
    scheduledDate.setMinutes(scheduledDate.getMinutes() - 30);

    if (scheduledDate.getTime() < Date.now()) {
        return null; // Time has passed
    }

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Sắp tới giờ nhiệm vụ! ⏰',
            body: `Nhiệm vụ "${task.title}" sẽ bắt đầu sau 30 phút (lúc ${task.scheduledTime}). Chuẩn bị hoàn thành đúng giờ để nhận 100% thưởng nhé!`,
            sound: true,
            data: { taskId: task._id },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledDate,
        },
    });
    return id;
}

export async function cancelAllQuestReminders(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAllQuestReminders(tasks: DailyTask[]): Promise<void> {
    await cancelAllQuestReminders();
    for (const task of tasks) {
        await scheduleQuestReminder(task);
    }
}
