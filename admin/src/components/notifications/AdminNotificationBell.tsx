import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { approvalService } from '../../services/approvalService';
import type { AccountNotificationItem } from '../../types';
import './AdminNotificationBell.css';

export const AdminNotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AccountNotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchInbox = useCallback(async () => {
        try {
            const data = await approvalService.getAdminAccountNotifications(1, 15);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch {
            // Keep existing inbox state when server is waking up
        }
    }, []);

    useEffect(() => {
        void fetchInbox();
        const timer = setInterval(() => {
            void fetchInbox();
        }, 30000);
        return () => clearInterval(timer);
    }, [fetchInbox]);

    const handleSelectNotification = async (item: AccountNotificationItem) => {
        if (!item.isRead) {
            await approvalService.markAdminNotificationRead(item._id).catch(() => undefined);
        }
        setOpen(false);
        void fetchInbox();

        const isAutoApproveMsg = item.title.includes('tự động duyệt');
        const isVoucherMsg =
            (item.relatedId && item.relatedId.startsWith('VCH-')) ||
            item.title.toLowerCase().includes('voucher') ||
            item.message.toLowerCase().includes('voucher');

        if (isAutoApproveMsg) {
            navigate(isVoucherMsg ? '/shop?tab=auto_approved' : '/quests?tab=auto_approved');
            return;
        }
        if (isVoucherMsg) {
            navigate('/shop?tab=redeem');
            return;
        }
        navigate('/quests?tab=approval');
    };

    const handleMarkAllRead = async () => {
        if (markingAll || unreadCount === 0) return;
        setMarkingAll(true);
        try {
            await approvalService.markAllAdminNotificationsRead();
            await fetchInbox();
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div className="admin-notif-bell">
            <button
                type="button"
                className="admin-notif-bell__trigger"
                title="Thông báo tài khoản Admin"
                onClick={() => setOpen((prev) => !prev)}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="admin-notif-bell__badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="admin-notif-bell__dropdown">
                    <div className="admin-notif-bell__header">
                        <span className="admin-notif-bell__title">
                            Hộp thư Admin ({unreadCount} chưa đọc)
                        </span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="admin-notif-bell__read-all"
                                disabled={markingAll}
                                onClick={() => void handleMarkAllRead()}
                            >
                                {markingAll ? 'Đang xử lý...' : 'Đọc tất cả'}
                            </button>
                        )}
                    </div>

                    <div className="admin-notif-bell__list">
                        {notifications.length === 0 ? (
                            <div className="admin-notif-bell__empty">
                                Chưa có thông báo nào trong tài khoản Admin
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item._id}
                                    className={`admin-notif-bell__item${
                                        !item.isRead ? ' admin-notif-bell__item--unread' : ''
                                    }`}
                                    onClick={() => void handleSelectNotification(item)}
                                >
                                    <div className="admin-notif-bell__item-title">{item.title}</div>
                                    <div className="admin-notif-bell__item-msg">{item.message}</div>
                                    <div className="admin-notif-bell__item-time">
                                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationBell;

