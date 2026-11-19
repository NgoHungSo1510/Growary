import React, { useState, useEffect, useCallback } from 'react';
import { approvalService } from '../../services/approvalService';
import { ConfirmModal, StatusBadge } from '../common';
import type { AutoApprovedReviewItem } from '../../types';
import './AutoApproval.css';

export interface AutoApprovedReviewTabProps {
    filterKind?: 'task' | 'voucher' | 'all';
    onReviewed?: () => void;
}

export const AutoApprovedReviewTab: React.FC<AutoApprovedReviewTabProps> = ({
    filterKind = 'all',
    onReviewed,
}) => {
    const [statusFilter, setStatusFilter] = useState<'pending_review' | 'all'>('pending_review');
    const [items, setItems] = useState<AutoApprovedReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [modalTarget, setModalTarget] = useState<{
        item: AutoApprovedReviewItem;
        action: 'revoke' | 'flag';
    } | null>(null);
    const [reviewNote, setReviewNote] = useState('');

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await approvalService.getAutoApprovedItems(statusFilter);
            const allItems = res.items || [];
            setItems(
                filterKind === 'all' ? allItems : allItems.filter((i) => i.kind === filterKind)
            );
        } catch {
            // Keep state on transient error
        } finally {
            setLoading(false);
        }
    }, [statusFilter, filterKind]);

    useEffect(() => {
        void fetchItems();
    }, [fetchItems]);

    const handleQuickConfirm = async (item: AutoApprovedReviewItem) => {
        const key = `${item.id}-${item.subTaskId || ''}`;
        if (submittingId) return;
        setSubmittingId(key);
        try {
            await approvalService.reviewAutoApprovedItem({
                kind: item.kind,
                id: item.id,
                subTaskId: item.subTaskId,
                action: 'confirm',
            });
            await fetchItems();
            onReviewed?.();
        } finally {
            setSubmittingId(null);
        }
    };

    const handleConfirmModalSubmit = async () => {
        if (!modalTarget || submittingId) return;
        const { item, action } = modalTarget;
        const key = `${item.id}-${item.subTaskId || ''}`;
        setSubmittingId(key);
        try {
            await approvalService.reviewAutoApprovedItem({
                kind: item.kind,
                id: item.id,
                subTaskId: item.subTaskId,
                action,
                note: reviewNote.trim() || undefined,
            });
            setModalTarget(null);
            setReviewNote('');
            await fetchItems();
            onReviewed?.();
        } finally {
            setSubmittingId(null);
        }
    };

    const renderStatusLabel = (item: AutoApprovedReviewItem): string => {
        if (item.adminReviewStatus === 'pending_review') {
            return item.kind === 'voucher' ? '📦 Cần giao quà' : '🤖 Chờ xem lại';
        }
        if (item.adminReviewStatus === 'confirmed') {
            return item.kind === 'voucher' ? '✅ Đã giao quà' : '✅ Đã xác nhận';
        }
        if (item.adminReviewStatus === 'revoked') {
            return '⚠️ Đã thu hồi điểm';
        }
        return '🚩 Đã gắn cờ';
    };

    return (
        <div className="card">
            <div className="card__header auto-review-toolbar">
                <span className="card__title">
                    🤖 Danh sách hệ thống tự động duyệt sau 6h ({items.length})
                </span>
                <div className="auto-review-filter-group">
                    <button
                        type="button"
                        className={`btn btn--sm ${
                            statusFilter === 'pending_review' ? 'btn--primary' : 'btn--secondary'
                        }`}
                        onClick={() => setStatusFilter('pending_review')}
                    >
                        Chờ xem lại
                    </button>
                    <button
                        type="button"
                        className={`btn btn--sm ${
                            statusFilter === 'all' ? 'btn--primary' : 'btn--secondary'
                        }`}
                        onClick={() => setStatusFilter('all')}
                    >
                        Tất cả lịch sử
                    </button>
                    <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => void fetchItems()}
                    >
                        🔄 Làm mới
                    </button>
                </div>
            </div>

            <div className="card__body">
                {loading ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">⏳</div>
                        <div className="empty-state__text">Đang tải danh sách hậu kiểm...</div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">✅</div>
                        <div className="empty-state__text">
                            Không có mục tự động duyệt nào cần Admin xem lại!
                        </div>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Loại</th>
                                <th>Người chơi</th>
                                <th>Nội dung</th>
                                <th>Giá trị / Thưởng</th>
                                <th>Lúc yêu cầu</th>
                                <th>Lúc tự duyệt</th>
                                <th>Trạng thái</th>
                                <th>Hậu kiểm của Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                const rowKey = `${item.id}-${item.subTaskId || ''}`;
                                const busy = submittingId === rowKey;
                                return (
                                    <tr key={rowKey}>
                                        <td>
                                            <span className="badge badge--info">
                                                {item.kind === 'task' ? '⚔️ Nhiệm vụ' : '🎁 Voucher'}
                                            </span>
                                        </td>
                                        <td>
                                            <div>{item.userName}</div>
                                            <small>{item.userEmail}</small>
                                        </td>
                                        <td>
                                            <strong>{item.title}</strong>
                                            {item.kind === 'voucher' && <div>Mã: {item.id}</div>}
                                            {item.adminReviewNote && (
                                                <div>Ghi chú: {item.adminReviewNote}</div>
                                            )}
                                        </td>
                                        <td>
                                            {item.kind === 'task'
                                                ? `+${item.pointsOrCost} XP / +${item.coinReward ?? 5} Xu`
                                                : `🪙 ${item.pointsOrCost} điểm`}
                                        </td>
                                        <td>{new Date(item.requestedAt).toLocaleString('vi-VN')}</td>
                                        <td>{new Date(item.autoApprovedAt).toLocaleString('vi-VN')}</td>
                                        <td>
                                            <StatusBadge
                                                status={item.adminReviewStatus}
                                                label={renderStatusLabel(item)}
                                            />
                                        </td>
                                        <td>
                                            {item.adminReviewStatus === 'pending_review' ? (
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn--success btn--sm"
                                                        disabled={busy}
                                                        onClick={() => void handleQuickConfirm(item)}
                                                    >
                                                        {busy
                                                            ? '⏳...'
                                                            : item.kind === 'voucher'
                                                            ? '✅ Đã giao'
                                                            : '✅ Hợp lệ'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn--danger btn--sm"
                                                        disabled={busy}
                                                        onClick={() => {
                                                            setReviewNote('');
                                                            setModalTarget({
                                                                item,
                                                                action:
                                                                    item.kind === 'task'
                                                                        ? 'revoke'
                                                                        : 'flag',
                                                            });
                                                        }}
                                                    >
                                                        {item.kind === 'task'
                                                            ? '⚠️ Thu hồi điểm'
                                                            : '🚩 Gắn cờ'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span>Đã xử lý</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmModal
                isOpen={modalTarget !== null}
                title={
                    modalTarget?.action === 'revoke'
                        ? 'Thu hồi nhiệm vụ đã tự động duyệt'
                        : 'Gắn cờ cảnh báo Voucher tự duyệt'
                }
                message={
                    modalTarget?.action === 'revoke'
                        ? `Nhiệm vụ "${modalTarget.item.title}" sẽ bị chuyển sang Từ chối và trừ lại điểm/xu đã cộng (nếu người chơi đã hoàn thành).`
                        : `Voucher "${modalTarget?.item.title}" (${modalTarget?.item.id}) sẽ được gắn cờ lưu ý và gửi cảnh báo cho người chơi.`
                }
                confirmText={modalTarget?.action === 'revoke' ? 'Thu hồi ngay' : 'Gắn cờ'}
                variant="danger"
                isLoading={submittingId !== null}
                onConfirm={() => void handleConfirmModalSubmit()}
                onClose={() => setModalTarget(null)}
            >
                <input
                    type="text"
                    className="auto-review-note-input"
                    placeholder="Nhập lý do thu hồi / gắn cờ (tuỳ chọn)..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                />
            </ConfirmModal>
        </div>
    );
};

export default AutoApprovedReviewTab;

