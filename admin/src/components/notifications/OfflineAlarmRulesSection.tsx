import React, { useState } from 'react';
import { notificationService } from '../../services/notificationService';
import type { NotificationConfig, NotificationTargetType } from '../../types';
import './NotificationCenter.css';

export interface OfflineAlarmRulesSectionProps {
    configs: NotificationConfig[];
    onRefresh: () => Promise<void>;
}

export const OfflineAlarmRulesSection: React.FC<OfflineAlarmRulesSectionProps> = ({
    configs,
    onRefresh,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentConfig, setCurrentConfig] = useState<NotificationConfig>({
        title: '',
        message: '',
        targetType: 'daily',
        triggerBeforeMinutes: 15,
        isActive: true,
    });

    const openCreate = () => {
        setCurrentConfig({
            title: '',
            message: '',
            targetType: 'daily',
            triggerBeforeMinutes: 15,
            isActive: true,
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (saving || !currentConfig.title.trim() || !currentConfig.message.trim()) return;
        setSaving(true);
        try {
            if (currentConfig._id) {
                await notificationService.updateOfflineAlarmRule(currentConfig._id, currentConfig);
            } else {
                await notificationService.createOfflineAlarmRule(currentConfig);
            }
            setIsEditing(false);
            await onRefresh();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id || !confirm('Bạn có chắc muốn xóa quy tắc hẹn giờ Offline này?')) return;
        await notificationService.deleteOfflineAlarmRule(id);
        await onRefresh();
    };

    return (
        <div className="card notif-center__section">
            <div className="card__header">
                <span className="card__title">
                    📱 Phân khu 2: Quy Tắc Hẹn Giờ Nhắc Nhở Trên Máy (Mobile Offline Alarm — {configs.length} quy tắc)
                </span>
                <button type="button" className="btn btn--primary" onClick={openCreate}>
                    + Thêm quy tắc hẹn giờ
                </button>
            </div>

            <div className="card__body">
                <div className="notif-center__explainer">
                    <div className="notif-center__explainer-title">
                        ⏰ Nhóm quy tắc Offline Alarm này hoạt động như thế nào khi Server ngủ đông?
                    </div>
                    <p className="notif-center__explainer-text">
                        Mỗi khi người chơi mở ứng dụng Mobile, toàn bộ quy tắc đang kích hoạt dưới đây được
                        tải về lưu vào <strong>Bộ nhớ đệm trên điện thoại (Offline Cache)</strong>. Hệ điều
                        hành Android sẽ tự động nổ chuông đúng số phút báo trước giờ hẹn nhiệm vụ và giờ khóa
                        sổ ngày 24:00 <strong>ngay cả khi Server Render đang ngủ đông hoàn toàn</strong>.
                    </p>
                </div>

                {configs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">⏰</div>
                        <div className="empty-state__text">
                            Chưa có quy tắc hẹn giờ Offline nào. Bấm "+ Thêm quy tắc hẹn giờ" để tạo!
                        </div>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Tiêu đề & Nội dung chuông báo</th>
                                <th>Loại sự kiện</th>
                                <th>Báo trước</th>
                                <th>Mô tả thời điểm hoạt động thực tế</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map((conf) => (
                                <tr key={conf._id}>
                                    <td>
                                        <strong>{conf.title}</strong>
                                        <div className="notif-center__meta">{conf.message}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge--info">{conf.targetType.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        <strong>{conf.triggerBeforeMinutes} phút</strong>
                                    </td>
                                    <td>
                                        <span className="notif-center__schedule-pill">
                                            {conf.scheduleDescription ||
                                                `Tự nổ chuông trên điện thoại trước ${conf.triggerBeforeMinutes} phút`}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                conf.isActive ? 'badge--success' : 'badge--danger'
                                            }`}
                                        >
                                            {conf.isActive ? 'Đang kích hoạt' : 'Tạm tắt'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button
                                                type="button"
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => {
                                                    setCurrentConfig(conf);
                                                    setIsEditing(true);
                                                }}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn--danger btn--sm"
                                                onClick={() => void handleDelete(conf._id)}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isEditing && (
                <div className="notif-center__modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="notif-center__modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="notif-center__modal-title">
                            {currentConfig._id ? '✏️ Sửa quy tắc Offline Alarm' : '➕ Thêm quy tắc Offline Alarm'}
                        </h3>
                        <div className="notif-center__form">
                            <div className="notif-center__field">
                                <label>Tiêu đề thông báo</label>
                                <input
                                    type="text"
                                    value={currentConfig.title}
                                    onChange={(e) =>
                                        setCurrentConfig({ ...currentConfig, title: e.target.value })
                                    }
                                    className="notif-center__input"
                                />
                            </div>
                            <div className="notif-center__field">
                                <label>Nội dung thông báo</label>
                                <textarea
                                    rows={3}
                                    value={currentConfig.message}
                                    onChange={(e) =>
                                        setCurrentConfig({ ...currentConfig, message: e.target.value })
                                    }
                                    className="notif-center__textarea"
                                />
                            </div>
                            <div className="notif-center__row">
                                <div className="notif-center__field">
                                    <label>Loại mục tiêu</label>
                                    <select
                                        value={currentConfig.targetType}
                                        onChange={(e) =>
                                            setCurrentConfig({
                                                ...currentConfig,
                                                targetType: e.target.value as NotificationTargetType,
                                            })
                                        }
                                        className="notif-center__select"
                                    >
                                        <option value="daily">Daily Reset / Tới hạn Nhiệm vụ</option>
                                        <option value="boss">Boss Xuất hiện / Kết thúc</option>
                                        <option value="event">Sự kiện đặc biệt</option>
                                    </select>
                                </div>
                                <div className="notif-center__field">
                                    <label>Báo trước (phút)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={1440}
                                        value={currentConfig.triggerBeforeMinutes}
                                        onChange={(e) =>
                                            setCurrentConfig({
                                                ...currentConfig,
                                                triggerBeforeMinutes: Math.max(1, Number(e.target.value)),
                                            })
                                        }
                                        className="notif-center__input"
                                    />
                                </div>
                            </div>
                            <label className="auto-approve-config__toggle">
                                <input
                                    type="checkbox"
                                    checked={currentConfig.isActive}
                                    onChange={(e) =>
                                        setCurrentConfig({ ...currentConfig, isActive: e.target.checked })
                                    }
                                />
                                <span>Kích hoạt (Đồng bộ về điện thoại làm Offline Alarm)</span>
                            </label>
                        </div>
                        <div className="notif-center__modal-actions">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => setIsEditing(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn btn--primary"
                                disabled={saving}
                                onClick={() => void handleSave()}
                            >
                                {saving ? '⏳ Đang lưu...' : '💾 Lưu quy tắc'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfflineAlarmRulesSection;

