import { httpClient } from './client';
import type {
    AutoApproveConfig,
    AutoApprovedReviewItem,
    AccountNotificationItem,
} from '../types';

export interface ReviewAutoApprovedPayload {
    kind: 'task' | 'voucher';
    id: string;
    subTaskId?: string;
    action: 'confirm' | 'revoke' | 'flag';
    note?: string;
}

class ApprovalAdminService {
    /**
     * Lấy cấu hình tự động duyệt 6h hiện hành từ máy chủ.
     * @returns Cấu hình AutoApproveConfig
     */
    async getAutoApproveConfig(): Promise<{ config: AutoApproveConfig }> {
        return httpClient.get<{ config: AutoApproveConfig }>('/admin/approvals/config');
    }

    /**
     * Cập nhật cấu hình tự động duyệt 6h.
     * @param data - Các trường cấu hình cần cập nhật
     * @returns Cấu hình sau khi lưu
     */
    async updateAutoApproveConfig(
        data: Partial<AutoApproveConfig>
    ): Promise<{ message: string; config: AutoApproveConfig }> {
        return httpClient.put<{ message: string; config: AutoApproveConfig }>(
            '/admin/approvals/config',
            data
        );
    }

    /**
     * Lấy danh sách các nhiệm vụ và voucher đã được hệ thống tự động duyệt.
     * @param status - Lọc theo 'pending_review' hoặc 'all'
     * @returns Danh sách AutoApprovedReviewItem
     */
    async getAutoApprovedItems(
        status: 'pending_review' | 'all' = 'pending_review'
    ): Promise<{ items: AutoApprovedReviewItem[] }> {
        return httpClient.get<{ items: AutoApprovedReviewItem[] }>(
            `/admin/approvals/auto-approved?status=${status}`
        );
    }

    /**
     * Gửi quyết định hậu kiểm của Admin (Xác nhận / Thu hồi / Gắn cờ) cho mục tự duyệt.
     * @param payload - Thông tin mục cần hậu kiểm và hành động
     * @returns Bản ghi sau khi cập nhật
     */
    async reviewAutoApprovedItem(
        payload: ReviewAutoApprovedPayload
    ): Promise<{ message: string; item: AutoApprovedReviewItem }> {
        return httpClient.post<{ message: string; item: AutoApprovedReviewItem }>(
            '/admin/approvals/review',
            payload
        );
    }

    /**
     * Lấy danh sách thông báo trong hộp thư Account của Admin đang đăng nhập.
     * @param page - Trang cần lấy
     * @param limit - Số bản ghi mỗi trang
     * @returns Danh sách thông báo và số lượng chưa đọc
     */
    async getAdminAccountNotifications(
        page = 1,
        limit = 15
    ): Promise<{ notifications: AccountNotificationItem[]; unreadCount: number }> {
        const [listRes, countRes] = await Promise.all([
            httpClient.get<{ notifications: AccountNotificationItem[] }>(
                `/notifications?page=${page}&limit=${limit}`
            ),
            httpClient.get<{ count: number }>('/notifications/unread-count'),
        ]);
        return {
            notifications: listRes.notifications || [],
            unreadCount: countRes.count || 0,
        };
    }

    /**
     * Đánh dấu 1 thông báo của tài khoản Admin là đã đọc.
     * @param id - ID của thông báo
     */
    async markAdminNotificationRead(id: string): Promise<void> {
        await httpClient.patch(`/notifications/${id}/read`, {});
    }

    /**
     * Đánh dấu toàn bộ thông báo của tài khoản Admin là đã đọc.
     */
    async markAllAdminNotificationsRead(): Promise<void> {
        await httpClient.post('/notifications/read-all', {});
    }
}

export const approvalService = new ApprovalAdminService();

