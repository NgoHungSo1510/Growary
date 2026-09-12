import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface BossCollection {
    _id: string;
    title: string;
    description: string;
    month: number;
    year: number;
    iconEmoji: string;
    themeColor?: string;
    completionStory: string;
    bonusTickets: number;
    isActive: boolean;
    bossCount?: number;
}

export default function BossCollectionManagement({ events = [], onEditBoss }: { events?: Array<any>, onEditBoss?: (boss: any) => void }) {
    const [collections, setCollections] = useState<BossCollection[]>([]);
    const [editCol, setEditCol] = useState<Partial<BossCollection> | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCollections = async () => {
        try {
            const res = await adminApi.get<{ collections: BossCollection[] }>('/admin/boss-collections');
            setCollections(res.collections);
        } catch (error) {
            console.error('Failed to fetch collections', error);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa bộ sưu tập này? Các nhân vật thuộc bộ này sẽ bị mất liên kết (collectionId = null).')) return;
        try {
            await adminApi.delete(`/admin/boss-collections/${id}`);
            fetchCollections();
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
            fetchCollections();
        } catch (error: any) {
            alert(error.message || 'Lỗi lưu bộ sưu tập');
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
                    onClick={() => { setEditCol({ title: '', description: '', iconEmoji: '🔥', themeColor: '#ef4444', completionStory: '', bonusTickets: 10, isActive: true }); setShowModal(true); }}
                >
                    + Thêm Bộ Sưu Tập
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {collections.map(col => (
                    <div key={col._id} className="card" style={{ padding: 16, borderTop: `4px solid ${col.isActive ? (col.themeColor || '#10b981') : '#cbd5e1'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontSize: 32 }}>{col.iconEmoji}</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16 }}>{col.title}</h3>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn--secondary btn--sm" onClick={() => { setEditCol(col); setShowModal(true); }}>✏️</button>
                                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(col._id)}>🗑️</button>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {col.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13, background: 'var(--bg)', padding: 8, borderRadius: 8 }}>
                            <span>Nhân vật: <strong>{col.bossCount || 0}</strong></span>
                            <span>Thưởng: <strong>{col.bonusTickets}🎫</strong></span>
                        </div>
                    </div>
                ))}
            </div>

            {collections.length === 0 && (
                <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-state__icon">📚</div>
                    <div className="empty-state__text">Chưa có Bộ Sưu Tập nào.</div>
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editCol?._id ? 'Sửa Bộ Sưu Tập' : 'Tạo Bộ Sưu Tập'}</span>
                            <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                                    <label>Biểu tượng (Emoji)</label>
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

                            {/* Danh sách các nhân vật thuộc bộ này */}
                            <div className="form-group" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                <label>Các Nhân vật thuộc bộ này:</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {editCol?._id && events.filter(ev => ev.collectionId === editCol._id).length > 0 ? (
                                        events.filter(ev => ev.collectionId === editCol._id).map(ev => (
                                            <div 
                                                key={ev._id} 
                                                onClick={() => onEditBoss && onEditBoss(ev)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                                                className="hover:bg-slate-100 transition-colors"
                                            >
                                                {ev.avatarImageUrl ? (
                                                    <img src={ev.avatarImageUrl} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} alt="char" />
                                                ) : (
                                                    <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: ev.colorBg || '#ccc' }} />
                                                )}
                                                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{ev.title}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>- {ev.status === 'upcoming' ? 'Sắp tới' : ev.status === 'active' ? 'Đang mở' : 'Đã kết thúc'}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chưa có nhân vật nào được thêm vào bộ này.</div>
                                    )}
                                </div>
                            </div>
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
