/**
 * Notification service stub.
 * 
 * expo-notifications has a module resolution bug in this Expo SDK version.
 * This stub provides the same API so the rest of the app compiles fine.
 * Notifications will work once you switch to a development build (npx expo prebuild).
 */
import { DailyTask } from '../types';

export async function requestNotificationPermissions(): Promise<boolean> {
    // No-op: expo-notifications not available in current environment
    return false;
}

export async function scheduleQuestReminder(task: DailyTask): Promise<string | null> {
    return null;
}

export async function cancelAllQuestReminders(): Promise<void> { }

export async function scheduleAllQuestReminders(tasks: DailyTask[]): Promise<void> { }
