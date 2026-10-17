import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

export interface TaskTemplate {
    _id: string;
    title: string;
    description?: string;
    pointsReward: number;
    coinReward: number;
    category: string;
    estimatedMinutes?: number;
    isMandatory: boolean;
    isActive: boolean;
    isSystemTask: boolean;
    frequency: string;
    createdAt: string;
}

export const CATEGORIES: { value: string; label: string; icon: string }[] = [
    { value: 'health', label: 'Sức khỏe', icon: '💪' },
    { value: 'study', label: 'Học tập', icon: '📚' },
    { value: 'work', label: 'Công việc', icon: '💼' },
    { value: 'personal', label: 'Cá nhân', icon: '🌱' },
    { value: 'household', label: 'Gia đình', icon: '🏠' },
    { value: 'other', label: 'Khác', icon: '✨' },
];

export const getCategoryInfo = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat) || { value: cat, label: cat, icon: '📋' };
};

interface TaskTemplateModalProps {
    isOpen: boolean;
    editTask: TaskTemplate | null;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const TaskTemplateModal: React.FC<TaskTemplateModalProps> = ({
    isOpen,
    editTask,
    onClose,
    onSaveSuccess,
}) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        pointsReward: 10,
        coinReward: 5,
        category: 'other',
        estimatedMinutes: 15,
        isMandatory: false,
        frequency: 'daily',
    });

    useEffect(() => {
        if (editTask) {
            setForm({
                title: editTask.title,
                description: editTask.description || '',
                pointsReward: editTask.pointsReward,
                coinReward: editTask.coinReward ?? 5,
                category: editTask.category || 'other',
                estimatedMinutes: editTask.estimatedMinutes || 15,
                isMandatory: editTask.isMandatory ?? false,
                frequency: editTask.frequency || 'daily',
            });
        } else {
            setForm({
                title: '',
                description: '',
                pointsReward: 10,
                coinReward: 5,
                category: 'other',
                estimatedMinutes: 15,
                isMandatory: false,
                frequency: 'daily',
            });
        }
    }, [editTask, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!form.title.trim()) return;
        try {
            if (editTask) {
                await adminApi.updateTask(editTask._id, form);
            } else {
                await adminApi.createTask(form);
            }
            onClose();
            onSaveSuccess();
        } catch (e: any) {
            alert('Lỗi: ' + e.message);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal__header">
                    <span className="modal__title">{editTask ? '✏️ Sửa nhiệm vụ' : '➕ Tạo nhiệm vụ hệ thống'}</span>
                    <button className="modal__close" onClick={onClose}>×</button>
                </div>
                <div className="modal__body">
                    <div className="form-group">
                        <label>Tên nhiệm vụ *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="VD: Dậy sớm 6h, Đọc sách 30 phút..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Mô tả chi tiết (sẽ hiện trên app)..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Thể loại</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, category: c.value })}
                                    style={{
                                        padding: '10px 8px',
                                        borderRadius: 8,
                                        border: `2px solid ${form.category === c.value ? 'var(--accent)' : 'var(--card-border)'}`,
                                        background: form.category === c.value ? 'var(--accent-light)' : 'white',
                                        cursor: 'pointer',
                                        fontWeight: form.category === c.value ? 700 : 400,
                                        fontSize: 13,
                                        transition: 'all 150ms ease',
                                    }}
                                >
                                    {c.icon} {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>XP thưởng</label>
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                value={form.pointsReward}
                                onChange={e => setForm({ ...form, pointsReward: Number(e.target.value) })}
                                style={{ flex: 1 }}
                            />
                        </div>
                        <div className="form-group">
                            <label>🪙 Coin thưởng</label>
                            <input
                                type="number"
                                min="0"
                                max="10000"
                                value={form.coinReward}
                                onChange={e => setForm({ ...form, coinReward: Number(e.target.value) })}
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Thời gian ước tính (phút)</label>
                            <input
                                type="number"
                                value={form.estimatedMinutes}
                                onChange={e => setForm({ ...form, estimatedMinutes: Number(e.target.value) })}
                                min={1}
                                max={480}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tần suất</label>
                            <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                                <option value="daily">📅 Hàng ngày</option>
                                <option value="weekly">📆 Hàng tuần</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Bắt buộc?</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
                            <input
                                type="checkbox"
                                checked={form.isMandatory}
                                onChange={e => setForm({ ...form, isMandatory: e.target.checked })}
                                style={{ width: 18, height: 18 }}
                            />
                            <span style={{ fontSize: 14 }}>
                                {form.isMandatory ? '⭐ Bắt buộc — hệ thống tự thêm vào mỗi ngày' : 'Tùy chọn — người chơi tự thêm'}
                            </span>
                        </label>
                    </div>

                    {form.title && (
                        <div style={{
                            marginTop: 8,
                            padding: 16,
                            background: '#fffbeb',
                            borderRadius: 10,
                            border: '1px solid #fde68a',
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>👁️ Xem trước trên app</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 28 }}>{getCategoryInfo(form.category).icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{form.title}</div>
                                    {form.description && <div style={{ fontSize: 12, color: '#78716c' }}>{form.description}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: '#d97706' }}>{form.pointsReward} XP</div>
                                    <div style={{ fontWeight: 600, color: '#f59e0b', fontSize: 12 }}>🪙 {form.coinReward}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={handleSave} disabled={!form.title.trim()}>
                        {editTask ? '💾 Cập nhật' : '🚀 Tạo nhiệm vụ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskTemplateModal;
