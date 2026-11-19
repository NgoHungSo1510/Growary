import { httpClient } from './client';
import type {
    NotificationConfig,
    SystemNotificationTrigger,
    SystemNotificationTriggerKey,
} from '../types';

export interface NotificationCenterData {
    configs: NotificationConfig[];
    systemTriggers: SystemNotificationTrigger[];
}

export interface BroadcastNotificationPayload {
    target: 'all_users' | 'single_user';
    userId?: string;
    title: string;
    message: string;
    type?: 'system' | 'reward' | 'penalty' | 'event' | 'approval';
}

class NotificationAdminService {
    /**
     * Lấy toàn bộ dữ liệu Trung tâm Thông báo (9 Trigger Hệ Thống + danh sách Quy tắc Offline Alarm).
     * @returns Đối tượng NotificationCenterData
     */
    async getNotificationCenter(): Promise<NotificationCenterData> {
        return httpClient.get<NotificationCenterData>('/admin/notifications');
    }

    /**
     * Tạo mới một quy tắc Offline Alarm (NotificationConfig).
     * @param data - Nội dung quy tắc
     */
    async createOfflineAlarmRule(
        data: Omit<NotificationConfig, '_id' | 'scheduleDescription'>
    ): Promise<{ config: NotificationConfig }> {
        return httpClient.post<{ config: NotificationConfig }>('/admin/notifications', data);
    }

    /**
     * Cập nhật một quy tắc Offline Alarm.
     * @param id - ID quy tắc
     * @param data - Nội dung cập nhật
     */
    async updateOfflineAlarmRule(
        id: string,
        data: Partial<NotificationConfig>
    ): Promise<{ config: NotificationConfig }> {
        return httpClient.put<{ config: NotificationConfig }>(`/admin/notifications/${id}`, data);
    }

    /**
     * Xóa một quy tắc Offline Alarm.
     * @param id - ID quy tắc
     */
    async deleteOfflineAlarmRule(id: string): Promise<{ message: string }> {
        return httpClient.delete<{ message: string }>(`/admin/notifications/${id}`);
    }

    /**
     * Cập nhật trạng thái bật/tắt hoặc mẫu nội dung của một Trigger thông báo hệ thống tự động.
     * @param key - Mã định danh trigger
     * @param patch - Các trường cần thay đổi
     */
    async updateSystemTrigger(
        key: SystemNotificationTriggerKey,
        patch: { enabled?: boolean; titleTemplate?: string; messageTemplate?: string }
    ): Promise<{ message: string; trigger: SystemNotificationTrigger }> {
        return httpClient.patch<{ message: string; trigger: SystemNotificationTrigger }>(
            `/admin/notifications/triggers/${key}`,
            patch
        );
    }

    /**
     * Gửi thông báo thủ công từ Admin tới hộp thư Account của toàn bộ người chơi hoặc 1 user cụ thể.
     * @param payload - Thông tin đối tượng nhận và nội dung
     */
    async broadcastManualNotification(
        payload: BroadcastNotificationPayload
    ): Promise<{ message: string; sentCount: number }> {
        return httpClient.post<{ message: string; sentCount: number }>(
            '/admin/notifications/broadcast',
            payload
        );
    }
}

export const notificationService = new NotificationAdminService();

