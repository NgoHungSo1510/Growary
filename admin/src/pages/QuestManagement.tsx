import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

interface TaskTemplate {
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

interface PendingTask {
    planId: string;
    taskId: string;
    title: string;
    pointsReward: number;
    coinReward: number;
    aiSuggestedPoints?: number;
    category?: string;
    description?: string;
    userName: string;
    userEmail: string;
    date: string;
}

type Tab = 'templates' | 'approval';

const CATEGORIES: { value: string; label: string; icon: string }[] = [
    { value: 'health', label: 'Sức khỏe', icon: '💪' },
    { value: 'study', label: 'Học tập', icon: '📚' },
    { value: 'work', label: 'Công việc', icon: '💼' },
    { value: 'personal', label: 'Cá nhân', icon: '🌱' },
    { value: 'household', label: 'Gia đình', icon: '🏠' },
    { value: 'other', label: 'Khác', icon: '✨' },
];

export default function QuestManagement() {
    const [tab, setTab] = useState<Tab>('templates');
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [pending, setPending] = useState<PendingTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState<TaskTemplate | null>(null);
    const [error, setError] = useState('');

    // Form state
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

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveTaskData, setApproveTaskData] = useState<{ planId: string; taskId: string; title: string; pointsReward: number; coinReward: number } | null>(null);

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getSystemTasks();
            setTemplates(data.tasks);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const data = await adminApi.getPendingTasks();
            setPending(data.tasks);
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
        fetchPending();
    }, [fetchTemplates, fetchPending]);

    const openCreate = () => {
        setEditTask(null);
        setForm({ title: '', description: '', pointsReward: 10, coinReward: 5, category: 'other', estimatedMinutes: 15, isMandatory: false, frequency: 'daily' });
        setShowModal(true);
    };

    const openEdit = (t: TaskTemplate) => {
        setEditTask(t);
        setForm({
            title: t.title,
            description: t.description || '',
            pointsReward: t.pointsReward,
            coinReward: t.coinReward ?? 5,
            category: t.category,
            estimatedMinutes: t.estimatedMinutes || 15,
            isMandatory: t.isMandatory,
            frequency: t.frequency,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        try {
            if (editTask) {
                await adminApi.updateTask(editTask._id, form);
            } else {
                await adminApi.createTask(form);
            }
            setShowModal(false);
            fetchTemplates();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xác nhận xóa nhiệm vụ này?')) return;
        try {
            await adminApi.deleteTask(id);
            fetchTemplates();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const confirmApprove = async () => {
        if (!approveTaskData) return;
        try {
            await adminApi.approveTask(approveTaskData.planId, approveTaskData.taskId, approveTaskData.pointsReward, approveTaskData.coinReward);
            setShowApproveModal(false);
            setApproveTaskData(null);
            fetchPending();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleReject = async (planId: string, taskId: string) => {
        try {
            await adminApi.rejectTask(planId, taskId);
            fetchPending();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[5];

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Quản lý Nhiệm vụ</h1>
                <p className="page__subtitle">Tạo nhiệm vụ hệ thống & duyệt nhiệm vụ từ người chơi</p>
            </div>

            {error && (
                <div style={{ padding: '10px 16px', background: 'var(--danger-light)', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    ❌ {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            <div className="tabs">
                <button className={`tabs__tab${tab === 'templates' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('templates')}>
                    📋 Thư viện nhiệm vụ ({templates.length})
                </button>
                <button className={`tabs__tab${tab === 'approval' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('approval')}>
                    ⏳ Chờ duyệt {pending.length > 0 && <span className="sidebar__badge" style={{ marginLeft: 6 }}>{pending.length}</span>}
                </button>
            </div>

            {/* TAB: Template Library */}
            {tab === 'templates' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">📋 Nhiệm vụ hệ thống</span>
                        <button className="btn btn--primary" onClick={openCreate}>+ Tạo nhiệm vụ</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">⏳</div>
                                <div className="empty-state__text">Đang tải...</div>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">📋</div>
                                <div className="empty-state__text">Chưa có nhiệm vụ hệ thống nào. Bấm "Tạo nhiệm vụ" để bắt đầu!</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nhiệm vụ</th>
                                        <th>Thể loại</th>
                                        <th>XP</th>
                                        <th>Coin</th>
                                        <th>Thời gian</th>
                                        <th>Tần suất</th>
                                        <th>Bắt buộc</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(t => {
                                        const cat = getCategoryInfo(t.category);
                                        return (
                                            <tr key={t._id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                                                    {t.description && (
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge badge--info">{cat.icon} {cat.label}</span>
                                                </td>
                                                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{t.pointsReward} XP</td>
                                                <td style={{ fontWeight: 700, color: '#f59e0b' }}>🪙 {t.coinReward ?? 5}</td>
                                                <td>{t.estimatedMinutes ? `${t.estimatedMinutes} phút` : '—'}</td>
                                                <td>{t.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}</td>
                                                <td>
                                                    {t.isMandatory ? (
                                                        <span className="badge badge--warning">⭐ Bắt buộc</span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>Tùy chọn</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button className="btn btn--secondary btn--sm" onClick={() => openEdit(t)}>✏️</button>
                                                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(t._id)}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: Approval Queue */}
            {tab === 'approval' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">⏳ Nhiệm vụ tự tạo chờ duyệt</span>
                        <button className="btn btn--secondary" onClick={fetchPending}>🔄 Làm mới</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {pending.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">✅</div>
                                <div className="empty-state__text">Không có nhiệm vụ nào chờ duyệt!</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nhiệm vụ</th>
                                        <th>Người tạo</th>
                                        <th>XP đề xuất</th>
                                        <th>AI đề xuất</th>
                                        <th>Ngày</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map(t => (
                                        <tr key={`${t.planId}-${t.taskId}`}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{t.title}</div>
                                                {t.description && (
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>
                                                )}
                                                {t.category && (
                                                    <span className="badge badge--info" style={{ marginTop: 4 }}>
                                                        {getCategoryInfo(t.category).icon} {getCategoryInfo(t.category).label}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{t.userName}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.userEmail}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{t.pointsReward} XP</td>
                                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                                {t.aiSuggestedPoints ? `${t.aiSuggestedPoints} XP` : '—'}
                                            </td>
                                            <td>{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--success btn--sm" onClick={() => {
                                                        setApproveTaskData({
                                                            planId: t.planId,
                                                            taskId: t.taskId,
                                                            title: t.title,
                                                            pointsReward: t.aiSuggestedPoints || t.pointsReward,
                                                            coinReward: t.aiSuggestedPoints || t.pointsReward // default coin to XP
                                                        });
                                                        setShowApproveModal(true);
                                                    }}>
                                                        ✅ Duyệt
                                                    </button>
                                                    <button className="btn btn--danger btn--sm" onClick={() => handleReject(t.planId, t.taskId)}>
                                                        ❌ Từ chối
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editTask ? '✏️ Sửa nhiệm vụ' : '➕ Tạo nhiệm vụ hệ thống'}</span>
                            <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
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
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={!form.title.trim()}>
                                {editTask ? '💾 Cập nhật' : '🚀 Tạo nhiệm vụ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Duyệt Nhiệm Vụ */}
            {showApproveModal && approveTaskData && (
                <div className="modal">
                    <div className="modal__content" style={{ maxWidth: 400 }}>
                        <div className="modal__header">
                            <h2 className="modal__title">✅ Duyệt nhiệm vụ</h2>
                            <button className="modal__close" onClick={() => setShowApproveModal(false)}>×</button>
                        </div>
                        <div className="modal__body">
                            <p style={{ marginBottom: 16 }}>Nhiệm vụ: <strong>{approveTaskData.title}</strong></p>

                            <div className="form-group">
                                <label>Mức XP thưởng</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={approveTaskData.pointsReward}
                                    onChange={e => setApproveTaskData({ ...approveTaskData, pointsReward: Number(e.target.value) })}
                                    style={{ flex: 1 }}
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Mức Coin thưởng</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10000"
                                    value={approveTaskData.coinReward}
                                    onChange={e => setApproveTaskData({ ...approveTaskData, coinReward: Number(e.target.value) })}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowApproveModal(false)}>Hủy</button>
                            <button className="btn btn--success" onClick={confirmApprove}>
                                Xác nhận {approveTaskData.pointsReward} XP + {approveTaskData.coinReward} Coin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
