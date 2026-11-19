import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/api';
import { approvalService } from '../services/approvalService';
import { TaskTemplateModal, ApproveTaskModal, CATEGORIES } from '../components/quest';
import { AutoApproveConfigBar, AutoApprovedReviewTab } from '../components/approval';
import type { TaskTemplate, PendingApprovalTask } from '../types';

type Tab = 'templates' | 'approval' | 'auto_approved';

const formatRemainingHours = (autoApproveAt?: string): string => {
    if (!autoApproveAt) return '⏳ Tự duyệt sau ~6h';
    const diffMs = new Date(autoApproveAt).getTime() - Date.now();
    if (diffMs <= 0) return '🤖 Đủ 6h — Sắp tự duyệt';
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    return `⏳ Tự duyệt sau ${h}h ${m}p`;
};

export default function QuestManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as Tab) || 'templates';
    const [tab, setTab] = useState<Tab>(
        ['templates', 'approval', 'auto_approved'].includes(initialTab) ? initialTab : 'templates'
    );
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [pending, setPending] = useState<PendingApprovalTask[]>([]);
    const [autoReviewCount, setAutoReviewCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState<TaskTemplate | null>(null);
    const [error, setError] = useState('');

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveTaskData, setApproveTaskData] = useState<{ planId: string; taskId: string; title: string; pointsReward: number; coinReward: number } | null>(null);

    useEffect(() => {
        const paramTab = searchParams.get('tab') as Tab | null;
        if (paramTab && ['templates', 'approval', 'auto_approved'].includes(paramTab) && paramTab !== tab) {
            setTab(paramTab);
        }
    }, [searchParams, tab]);

    const handleSwitchTab = (nextTab: Tab) => {
        setTab(nextTab);
        setSearchParams({ tab: nextTab });
    };

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getSystemTasks();
            setTemplates(data.tasks);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPending = useCallback(async () => {
        try {
            const [pendingRes, autoRes] = await Promise.all([
                adminApi.getPendingTasks(),
                approvalService.getAutoApprovedItems('pending_review').catch(() => ({ items: [] })),
            ]);
            setPending(pendingRes.tasks);
            setAutoReviewCount(autoRes.items.filter((i) => i.kind === 'task').length);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Lỗi tải danh sách chờ duyệt');
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
        fetchPending();
    }, [fetchTemplates, fetchPending]);

    const openCreate = () => {
        setEditTask(null);
        setShowModal(true);
    };

    const openEdit = (t: TaskTemplate) => {
        setEditTask(t);
        setShowModal(true);
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

    const handleConfirmApprove = async (planId: string, taskId: string, points: number, coins: number) => {
        try {
            await adminApi.approveTask(planId, taskId, points, coins);
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
                <button className={`tabs__tab${tab === 'templates' ? ' tabs__tab--active' : ''}`} onClick={() => handleSwitchTab('templates')}>
                    📋 Thư viện nhiệm vụ ({templates.length})
                </button>
                <button className={`tabs__tab${tab === 'approval' ? ' tabs__tab--active' : ''}`} onClick={() => handleSwitchTab('approval')}>
                    ⏳ Chờ duyệt {pending.length > 0 && <span className="sidebar__badge" style={{ marginLeft: 6 }}>{pending.length}</span>}
                </button>
                <button className={`tabs__tab${tab === 'auto_approved' ? ' tabs__tab--active' : ''}`} onClick={() => handleSwitchTab('auto_approved')}>
                    🤖 Tự duyệt — Chờ xem lại {autoReviewCount > 0 && <span className="sidebar__badge" style={{ marginLeft: 6 }}>{autoReviewCount}</span>}
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
                                            <td>
                                                <div>{new Date(t.date).toLocaleDateString('vi-VN')}</div>
                                                <span className="auto-countdown-pill">
                                                    {formatRemainingHours(t.autoApproveAt)}
                                                </span>
                                            </td>
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

            {/* TAB: Auto-Approved Review Queue */}
            {tab === 'auto_approved' && (
                <>
                    <AutoApproveConfigBar />
                    <AutoApprovedReviewTab filterKind="task" onReviewed={fetchPending} />
                </>
            )}

            {/* Create / Edit Modal */}
            <TaskTemplateModal
                isOpen={showModal}
                editTask={editTask}
                onClose={() => setShowModal(false)}
                onSaveSuccess={fetchTemplates}
            />

            {/* Modal: Duyệt Nhiệm Vụ */}
            <ApproveTaskModal
                isOpen={showApproveModal}
                data={approveTaskData}
                onClose={() => {
                    setShowApproveModal(false);
                    setApproveTaskData(null);
                }}
                onConfirm={handleConfirmApprove}
            />
        </div>
    );
}
