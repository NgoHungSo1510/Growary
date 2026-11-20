import React, { useState } from 'react';
import { BossCollectionDTO, BossEvent } from '../../types';
import { bossService } from '../../services/bossService';

export interface CollectionCharacterManagerProps {
    collectionId?: string;
    collectionTitle?: string;
    allCollections: BossCollectionDTO[];
    allBosses: BossEvent[];
    onEditBoss: (boss: BossEvent) => void;
    onCreateBossInCollection: () => void;
    onAssignmentChanged: () => Promise<void> | void;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4 }}>Đang mở</span>;
        case 'upcoming':
            return <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4 }}>Sắp tới</span>;
        case 'completed':
            return <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>Đã diệt</span>;
        default:
            return <span style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: 4 }}>Trong Pool</span>;
    }
};

export const CollectionCharacterManager: React.FC<CollectionCharacterManagerProps> = ({
    collectionId,
    collectionTitle,
    allCollections,
    allBosses,
    onEditBoss,
    onCreateBossInCollection,
    onAssignmentChanged,
}) => {
    const [selectedBossIds, setSelectedBossIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const isExistingCol = Boolean(collectionId);
    const inCollectionBosses = isExistingCol
        ? allBosses.filter((ev) => String(ev.collectionId) === String(collectionId))
        : [];

    const validColIds = new Set(allCollections.map((c) => String(c._id)));
    const unassignedBosses = allBosses.filter(
        (ev) => !ev.collectionId || !validColIds.has(String(ev.collectionId))
    );

    const filteredUnassigned = unassignedBosses.filter((b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const otherCollections = allCollections.filter(
        (c) => String(c._id) !== String(collectionId)
    );

    const handleAssign = async (bossIds: string[]) => {
        if (!collectionId || bossIds.length === 0) return;
        try {
            setIsAssigning(true);
            setActionError(null);
            await bossService.assignCharactersToCollection(bossIds, collectionId);
            setSelectedBossIds((prev) => prev.filter((id) => !bossIds.includes(id)));
            await onAssignmentChanged();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Lỗi khi gán nhân vật');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDetach = async (bossId: string) => {
        if (!window.confirm('Gỡ nhân vật này khỏi bộ sưu tập? Nhân vật sẽ trở về danh sách Chưa thuộc bộ nào.')) return;
        try {
            setIsAssigning(true);
            setActionError(null);
            await bossService.assignCharactersToCollection([bossId], null);
            await onAssignmentChanged();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Lỗi khi gỡ nhân vật');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleTransfer = async (bossId: string, targetColId: string) => {
        if (!targetColId) return;
        try {
            setIsAssigning(true);
            setActionError(null);
            await bossService.assignCharactersToCollection([bossId], targetColId);
            await onAssignmentChanged();
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Lỗi khi chuyển bộ');
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleSelect = (bossId: string) => {
        setSelectedBossIds((prev) =>
            prev.includes(bossId) ? prev.filter((id) => id !== bossId) : [...prev, bossId]
        );
    };

    return (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {actionError && (
                <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                    ⚠️ {actionError}
                </div>
            )}

            {/* PHÂN KHU 1: NHÂN VẬT ĐANG THUỘC BỘ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ margin: 0, fontWeight: 600 }}>
                    Các nhân vật thuộc bộ này ({inCollectionBosses.length})
                </label>
                {isExistingCol && (
                    <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        style={{ color: '#16a34a', borderColor: '#86efac', background: '#f0fdf4' }}
                        onClick={onCreateBossInCollection}
                        title={`Tạo nhân vật mới liên kết trực tiếp vào ${collectionTitle || 'bộ này'}`}
                    >
                        ➕ Tạo nhân vật trong bộ này
                    </button>
                )}
            </div>

            {inCollectionBosses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {inCollectionBosses.map((boss) => (
                        <div
                            key={boss._id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg)',
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                gap: 12,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                {boss.avatarImageUrl ? (
                                    <img src={boss.avatarImageUrl} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} alt={boss.title} />
                                ) : (
                                    <div style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: boss.colorBg || '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>
                                        👾
                                    </div>
                                )}
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{boss.title}</span>
                                    <span style={{ marginLeft: 8 }}>{getStatusBadge(boss.status)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {otherCollections.length > 0 && (
                                    <select
                                        style={{ fontSize: 12, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)' }}
                                        defaultValue=""
                                        disabled={isAssigning}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleTransfer(boss._id, e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        title="Chuyển nhân vật này sang bộ sưu tập khác"
                                    >
                                        <option value="" disabled>🔄 Đổi sang bộ...</option>
                                        {otherCollections.map((c) => (
                                            <option key={c._id} value={c._id}>{c.iconEmoji} {c.title}</option>
                                        ))}
                                    </select>
                                )}
                                <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    onClick={() => onEditBoss(boss)}
                                    title="Sửa chi tiết nhân vật"
                                >
                                    ✏️
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--danger btn--sm"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    disabled={isAssigning}
                                    onClick={() => handleDetach(boss._id)}
                                    title="Gỡ nhân vật khỏi bộ sưu tập"
                                >
                                    ❌ Gỡ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', marginBottom: 20 }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                        Bộ sưu tập này chưa có nhân vật nào.
                    </p>
                    {isExistingCol && (
                        <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={onCreateBossInCollection}
                        >
                            ➕ Tạo nhân vật mới liên kết với bộ này
                        </button>
                    )}
                </div>
            )}

            {/* PHÂN KHU 2: THÊM NHÂN VẬT CHƯA CÓ BỘ VÀO BỘ NÀY */}
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                        📥 Thêm nhân vật chưa có bộ ({unassignedBosses.length})
                    </label>
                    {selectedBossIds.length > 0 && isExistingCol && (
                        <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            disabled={isAssigning}
                            onClick={() => handleAssign(selectedBossIds)}
                        >
                            + Thêm ({selectedBossIds.length}) nhân vật đã chọn
                        </button>
                    )}
                </div>

                {!isExistingCol ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', background: '#fffbeb', padding: 10, borderRadius: 6, border: '1px solid #fef3c7' }}>
                        💡 Hãy bấm <strong>Lưu Lại</strong> để tạo bộ sưu tập trước, sau đó bạn có thể thêm các nhân vật có sẵn hoặc tạo nhân vật mới cho bộ này.
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="🔍 Tìm nhân vật tự do theo tên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 8 }}
                        />

                        {filteredUnassigned.length > 0 ? (
                            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                                {filteredUnassigned.map((boss) => {
                                    const isSelected = selectedBossIds.includes(boss._id);
                                    return (
                                        <div
                                            key={boss._id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: isSelected ? '#f0fdf4' : 'var(--bg)',
                                                border: `1px solid ${isSelected ? '#86efac' : 'var(--border)'}`,
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                fontSize: 13,
                                            }}
                                        >
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, margin: 0 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(boss._id)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ fontWeight: 500 }}>{boss.title}</span>
                                                {getStatusBadge(boss.status)}
                                            </label>
                                            <button
                                                type="button"
                                                className="btn btn--secondary btn--sm"
                                                style={{ padding: '3px 8px', fontSize: 12 }}
                                                disabled={isAssigning}
                                                onClick={() => handleAssign([boss._id])}
                                            >
                                                + Thêm vào bộ
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                                {searchQuery ? 'Không tìm thấy nhân vật phù hợp' : 'Tất cả nhân vật đều đã được xếp vào bộ sưu tập!'}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

