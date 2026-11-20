import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { BossCollectionDTO, BossEvent } from '../types';
import { CollectionCharacterManager } from './boss/CollectionCharacterManager';

interface BossCollectionManagementProps {
    collections?: BossCollectionDTO[];
    events?: BossEvent[];
    onEditBoss?: (boss: BossEvent) => void;
    onCreateBossInCollection?: (collection: BossCollectionDTO) => void;
    onRefreshData?: () => Promise<void> | void;
}

export default function BossCollectionManagement({
    collections: propCollections,
    events = [],
    onEditBoss,
    onCreateBossInCollection,
    onRefreshData,
}: BossCollectionManagementProps) {
    const [collections, setCollections] = useState<BossCollectionDTO[]>(propCollections || []);
    const [editCol, setEditCol] = useState<Partial<BossCollectionDTO> | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (propCollections && propCollections.length > 0) {
            setCollections(propCollections);
        }
    }, [propCollections]);

    const fetchCollections = async () => {
        try {
            const res = await adminApi.get<{ collections: BossCollectionDTO[] }>('/admin/boss-collections');
            setCollections(res.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections', error);
        }
    };

    useEffect(() => {
        if (!propCollections) {
            fetchCollections();
        }
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa bộ sưu tập này? Các nhân vật thuộc bộ này sẽ bị mất liên kết (collectionId = null).')) return;
        try {
            await adminApi.delete(`/admin/boss-collections/${id}`);
            await fetchCollections();
            if (onRefreshData) await onRefreshData();
        } catch (error) {
            alert('Lỗi khi xóa bộ sưu tập');
        }
    };

    const handleSave = async () => {
        if (!editCol?.title || !editCol?.month || !editCol?.year) {
            alert('Vui lòng nhập đủ Tiêu đề, Tháng và Năm');
            return;
        }

        try {
            setIsLoading(true);
            if (editCol._id) {
                await adminApi.put(`/admin/boss-collections/${editCol._id}`, editCol);
            } else {
                await adminApi.post('/admin/boss-collections', editCol);
            }
            setShowModal(false);
            setEditCol(null);
            await fetchCollections();
            if (onRefreshData) await onRefreshData();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Lỗi lưu bộ sưu tập';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h2 style={{ fontSize: 20, margin: 0 }}>Quản lý Bộ Sưu Tập Nhân Vật</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Quản lý các bộ sưu tập nhân vật theo mùa/tháng.</p>
                </div>
                <button 
                    className="btn btn--primary" 
                    onClick={() => {
                        const now = new Date();
                        setEditCol({
                            title: '',
                            description: '',
                            month: now.getMonth() + 1,
                            year: now.getFullYear(),
                            iconEmoji: '🔥',
                            themeColor: '#ef4444',
                            completionStory: '',
                            bonusTickets: 10,
                            isActive: true,
                        });
                        setShowModal(true);
                    }}
                >
                    + Thêm Bộ Sưu Tập
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {collections.map(col => {
                    const actualCount = events.filter(ev => String(ev.collectionId) === String(col._id)).length;
                    return (
                        <div
                            key={col._id}
                            className="card hover:shadow-md transition-shadow"
                            style={{
                                padding: 16,
                                borderTop: `4px solid ${col.isActive ? (col.themeColor || '#10b981') : '#cbd5e1'}`,
                                cursor: 'pointer',
                            }}
                            onClick={() => { setEditCol(col); setShowModal(true); }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ fontSize: 32 }}>{col.iconEmoji}</div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 16 }}>{col.title}</h3>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tháng {col.month}/{col.year}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                                    <button className="btn btn--secondary btn--sm" onClick={() => { setEditCol(col); setShowModal(true); }} title="Sửa thông tin bộ">✏️</button>
                                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(col._id)} title="Xóa bộ">🗑️</button>
                                </div>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {col.description || 'Chưa có mô tả'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13, background: 'var(--bg)', padding: '8px 12px', borderRadius: 8 }}>
                                <span>Nhân vật: <strong>{actualCount}</strong></span>
                                <span>Thưởng: <strong>{col.bonusTickets}🎫</strong></span>
                                <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    style={{ padding: '2px 8px', fontSize: 12, color: '#16a34a', borderColor: '#86efac' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onCreateBossInCollection) onCreateBossInCollection(col);
                                    }}
                                    title="Tạo nhanh nhân vật mới gắn sẵn vào bộ này"
                                >
                                    ➕ Tạo nhân vật
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {collections.length === 0 && (
                <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-state__icon">📚</div>
                    <div className="empty-state__text">Chưa có Bộ Sưu Tập nào.</div>
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editCol?._id ? `Quản lý Bộ: ${editCol.title}` : 'Tạo Bộ Sưu Tập'}</span>
                            <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal__body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>Tiêu đề</label>
                                <input 
                                    type="text" 
                                    value={editCol?.title || ''} 
                                    onChange={e => setEditCol({...editCol, title: e.target.value})} 
                                    placeholder="VD: Bộ Tháng 10 - Halloween" 
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Tháng (1-12)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="12" 
                                        value={editCol?.month || (new Date().getMonth() + 1)} 
                                        onChange={e => setEditCol({...editCol, month: Number(e.target.value)})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Năm</label>
                                    <input 
                                        type="number" 
                                        value={editCol?.year || new Date().getFullYear()} 
                                        onChange={e => setEditCol({...editCol, year: Number(e.target.value)})} 
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Biểu tượng & Màu Theme</label>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <input type="text" value={editCol?.iconEmoji || ''} onChange={e => setEditCol({...editCol, iconEmoji: e.target.value})} style={{ flex: 1 }} />
                                        <input type="color" value={editCol?.themeColor || '#ef4444'} onChange={e => setEditCol({...editCol, themeColor: e.target.value})} style={{ width: 50, height: 40, padding: 0 }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Thưởng Vé Gacha (Hoàn thành bộ)</label>
                                    <input type="number" value={editCol?.bonusTickets || 0} onChange={e => setEditCol({...editCol, bonusTickets: Number(e.target.value)})} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mô tả ngắn</label>
                                <textarea value={editCol?.description || ''} onChange={e => setEditCol({...editCol, description: e.target.value})} rows={2} />
                            </div>

                            <div className="form-group">
                                <label>Câu chuyện hoàn thành (Completion Story)</label>
                                <textarea 
                                    value={editCol?.completionStory || ''} 
                                    onChange={e => setEditCol({...editCol, completionStory: e.target.value})} 
                                    rows={3} 
                                    placeholder="Hiển thị khi thu thập đủ các nhân vật trong bộ..."
                                />
                            </div>

                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <input 
                                    type="checkbox" 
                                    checked={editCol?.isActive ?? true} 
                                    onChange={e => setEditCol({...editCol, isActive: e.target.checked})} 
                                    id="isActiveCol"
                                />
                                <label htmlFor="isActiveCol" style={{ margin: 0 }}>Đang hoạt động (Hiển thị trên Mobile)</label>
                            </div>

                            {/* Quản lý danh sách nhân vật trong bộ & thêm nhân vật chưa có bộ */}
                            <CollectionCharacterManager
                                collectionId={editCol?._id}
                                collectionTitle={editCol?.title}
                                allCollections={collections}
                                allBosses={events}
                                onEditBoss={(boss) => {
                                    setShowModal(false);
                                    if (onEditBoss) onEditBoss(boss);
                                }}
                                onCreateBossInCollection={() => {
                                    if (editCol?._id && onCreateBossInCollection) {
                                        setShowModal(false);
                                        onCreateBossInCollection(editCol as BossCollectionDTO);
                                    }
                                }}
                                onAssignmentChanged={async () => {
                                    await fetchCollections();
                                    if (onRefreshData) await onRefreshData();
                                }}
                            />
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={isLoading}>Lưu Lại</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
