import React, { useState } from 'react';
import { notificationService } from '../../services/notificationService';
import type { SystemNotificationTrigger } from '../../types';
import './NotificationCenter.css';

export interface SystemTriggerCatalogTableProps {
    triggers: SystemNotificationTrigger[];
    onRefresh: () => Promise<void>;
}

export const SystemTriggerCatalogTable: React.FC<SystemTriggerCatalogTableProps> = ({
    triggers,
    onRefresh,
}) => {
    const [editing, setEditing] = useState<SystemNotificationTrigger | null>(null);
    const [titleTemplate, setTitleTemplate] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('');
    const [busyKey, setBusyKey] = useState<string | null>(null);

    const handleToggleEnabled = async (trigger: SystemNotificationTrigger) => {
        if (busyKey) return;
        setBusyKey(trigger.key);
        try {
            await notificationService.updateSystemTrigger(trigger.key, {
                enabled: !trigger.enabled,
            });
            await onRefresh();
        } finally {
            setBusyKey(null);
        }
    };

    const openEditModal = (trigger: SystemNotificationTrigger) => {
        setEditing(trigger);
        setTitleTemplate(trigger.titleTemplate);
        setMessageTemplate(trigger.messageTemplate);
    };

    const handleSaveTemplate = async () => {
        if (!editing || busyKey) return;
        setBusyKey(editing.key);
        try {
            await notificationService.updateSystemTrigger(editing.key, {
                titleTemplate: titleTemplate.trim(),
                messageTemplate: messageTemplate.trim(),
            });
            setEditing(null);
            await onRefresh();
        } finally {
            setBusyKey(null);
        }
    };

    const renderRecipientBadge = (role: SystemNotificationTrigger['recipientRole']) => {
        if (role === 'admin') {
            return <span className="badge badge--warning">🔔 Account Admin</span>;
        }
        if (role === 'both') {
            return <span className="badge badge--info">🔔 Admin + 📱 User</span>;
        }
        return <span className="badge badge--success">📱 Account User</span>;
    };

    return (
        <div className="card notif-center__section">
            <div className="card__header">
                <span className="card__title">
                    ⚡ Phân khu 1: Luồng Thông Báo Hệ Thống Tự Động (Account Inbox — {triggers.length} luồng)
                </span>
            </div>
            <div className="card__body">
                <div className="notif-center__explainer">
                    <div className="notif-center__explainer-title">
                        💡 Nhóm thông báo này hoạt động khi nào?
                    </div>
                    <p className="notif-center__explainer-text">
                        Các thông báo dưới đây được Backend tự động tạo và gửi vào{' '}
                        <strong>Hộp thư Account</strong> của Admin (Chuông 🔔 trên góc phải TopBar) hoặc
                        của Người chơi ngay khi sự kiện phát sinh. Khi ứng dụng Mobile đồng bộ với máy chủ,
                        thông báo mới chưa đọc cũng sẽ tự nổ thành <strong>Local Banner</strong> trên điện thoại.
                    </p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Luồng thông báo & Mẫu câu</th>
                            <th>Hoạt động khi nào (Điều kiện kích hoạt)</th>
                            <th>Người nhận</th>
                            <th>Cơ chế khi Server ngủ đông</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {triggers.map((item) => (
                            <tr key={item.key}>
                                <td>
                                    <strong>{item.name}</strong>
                                    <div className="notif-center__meta">
                                        Tiêu đề: <em>{item.titleTemplate}</em>
                                    </div>
                                    <div className="notif-center__meta">
                                        Nội dung: {item.messageTemplate}
                                    </div>
                                </td>
                                <td className="notif-center__meta">{item.whenItFires}</td>
                                <td>{renderRecipientBadge(item.recipientRole)}</td>
                                <td>
                                    <span className="notif-center__hibernation-box">
                                        {item.hibernationBehavior}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={`badge ${
                                            item.enabled ? 'badge--success' : 'badge--danger'
                                        }`}
                                    >
                                        {item.enabled ? 'Đang bật' : 'Đang tắt'}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button
                                            type="button"
                                            className="btn btn--secondary btn--sm"
                                            disabled={busyKey === item.key}
                                            onClick={() => openEditModal(item)}
                                        >
                                            ✏️ Sửa mẫu
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn--sm ${
                                                item.enabled ? 'btn--danger' : 'btn--success'
                                            }`}
                                            disabled={busyKey === item.key}
                                            onClick={() => void handleToggleEnabled(item)}
                                        >
                                            {busyKey === item.key
                                                ? '⏳...'
                                                : item.enabled
                                                ? 'Tắt'
                                                : 'Bật'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="notif-center__modal-overlay" onClick={() => setEditing(null)}>
                    <div
                        className="notif-center__modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="notif-center__modal-title">
                            ✏️ Chỉnh sửa mẫu: {editing.name}
                        </h3>
                        <div className="notif-center__form">
                            <div className="notif-center__field">
                                <label>Tiêu đề thông báo</label>
                                <input
                                    type="text"
                                    value={titleTemplate}
                                    onChange={(e) => setTitleTemplate(e.target.value)}
                                    className="notif-center__input"
                                />
                            </div>
                            <div className="notif-center__field">
                                <label>Nội dung mẫu (Hỗ trợ biến &#123;username&#125;, &#123;title&#125;)</label>
                                <textarea
                                    rows={3}
                                    value={messageTemplate}
                                    onChange={(e) => setMessageTemplate(e.target.value)}
                                    className="notif-center__textarea"
                                />
                            </div>
                        </div>
                        <div className="notif-center__modal-actions">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => setEditing(null)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn--primary"
                                disabled={busyKey !== null}
                                onClick={() => void handleSaveTemplate()}
                            >
                                {busyKey ? '⏳ Đang lưu...' : '💾 Lưu mẫu câu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemTriggerCatalogTable;

