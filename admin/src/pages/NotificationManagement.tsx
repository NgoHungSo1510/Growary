import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { SystemTriggerCatalogTable } from '../components/notifications/SystemTriggerCatalogTable';
import { OfflineAlarmRulesSection } from '../components/notifications/OfflineAlarmRulesSection';
import type { NotificationConfig, SystemNotificationTrigger } from '../types';
import '../components/notifications/NotificationCenter.css';

export default function NotificationManagement() {
    const [configs, setConfigs] = useState<NotificationConfig[]>([]);
    const [systemTriggers, setSystemTriggers] = useState<SystemNotificationTrigger[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastSending, setBroadcastSending] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const fetchCenterData = useCallback(async () => {
        try {
            const data = await notificationService.getNotificationCenter();
            setConfigs(data.configs || []);
            setSystemTriggers(data.systemTriggers || []);
        } catch {
            // Keep existing data if server is waking
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchCenterData();
    }, [fetchCenterData]);

    const handleSendBroadcast = async () => {
        if (broadcastSending || !broadcastTitle.trim() || !broadcastMessage.trim()) return;
        setBroadcastSending(true);
        setFeedback(null);
        try {
            const res = await notificationService.broadcastManualNotification({
                target: 'all_users',
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim(),
                type: 'system',
            });
            setFeedback(`✅ Đã gửi thông báo tới hộp thư Account của ${res.sentCount} người chơi!`);
            setShowBroadcast(false);
            setBroadcastTitle('');
            setBroadcastMessage('');
        } catch (err: unknown) {
            setFeedback(err instanceof Error ? `❌ ${err.message}` : '❌ Gửi thông báo thất bại');
        } finally {
            setBroadcastSending(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-state__icon">⏳</div>
                    <div className="empty-state__text">Đang tải Trung tâm Thông báo...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="page__header auto-review-toolbar">
                <div>
                    <h1 className="page__title">Trung tâm Quản lý Thông báo</h1>
                    <p className="page__subtitle">
                        Minh bạch hóa toàn bộ luồng Thông báo Account tự động và Quy tắc hẹn giờ Offline Alarm trên điện thoại
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setShowBroadcast(true)}
                >
                    📢 Gửi thông báo thủ công tới User
                </button>
            </header>

            {feedback && (
                <div className="notif-center__explainer">
                    <div className="notif-center__explainer-title">{feedback}</div>
                </div>
            )}

            <SystemTriggerCatalogTable triggers={systemTriggers} onRefresh={fetchCenterData} />
            <OfflineAlarmRulesSection configs={configs} onRefresh={fetchCenterData} />

            {showBroadcast && (
                <div className="notif-center__modal-overlay" onClick={() => setShowBroadcast(false)}>
                    <div className="notif-center__modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="notif-center__modal-title">
                            📢 Gửi thông báo thủ công qua Account tới toàn bộ Người chơi
                        </h3>
                        <div className="notif-center__form">
                            <div className="notif-center__field">
                                <label>Tiêu đề thông báo</label>
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="VD: Thông báo sự kiện đặc biệt cuối tuần"
                                    className="notif-center__input"
                                />
                            </div>
                            <div className="notif-center__field">
                                <label>Nội dung chi tiết</label>
                                <textarea
                                    rows={3}
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Nhập nội dung gửi vào hộp thư Account người chơi..."
                                    className="notif-center__textarea"
                                />
                            </div>
                        </div>
                        <div className="notif-center__modal-actions">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => setShowBroadcast(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn--primary"
                                disabled={broadcastSending}
                                onClick={() => void handleSendBroadcast()}
                            >
                                {broadcastSending ? '⏳ Đang gửi...' : '🚀 Gửi ngay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
