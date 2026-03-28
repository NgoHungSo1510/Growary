import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface CollectionTopic {
    _id: string;
    title: string;
    description: string;
    imageUrl?: string;
    colorBg: string;
    colorAccent: string;
    totalSlots: number;
    rewardPerEntry: { coins: number; xp: number; gachaTickets: number };
    milestoneRewards: { target: number; coins: number; xp: number; gachaTickets: number }[];
    isActive: boolean;
    order: number;
}

export default function CollectionManagementPage() {
    const [topics, setTopics] = useState<CollectionTopic[]>([]);
    const [editTopic, setEditTopic] = useState<Partial<CollectionTopic> | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [viewEntries, setViewEntries] = useState<{ topicId: string; topicTitle: string; entries: any[] } | null>(null);

    const fetchTopics = async () => {
        try {
            const res = await adminApi.get<{ topics: CollectionTopic[] }>('/admin/collections');
            setTopics(res.topics);
        } catch (error) {
            console.error('Failed to fetch collection topics', error);
        }
    };

    useEffect(() => { fetchTopics(); }, []);

    const handleSave = async () => {
        if (!editTopic?.title || !editTopic?.totalSlots) {
            alert('Vui lòng nhập Tên và Số ô');
            return;
        }
        try {
            setIsLoading(true);
            if (editTopic._id) {
                await adminApi.put(`/admin/collections/${editTopic._id}`, editTopic);
            } else {
                await adminApi.post('/admin/collections', editTopic);
            }
            setShowModal(false);
            setEditTopic(null);
            fetchTopics();
        } catch (error: any) {
            alert(error.message || 'Lỗi lưu chủ đề');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa chủ đề này?')) return;
        try {
            await adminApi.delete(`/admin/collections/${id}`);
            fetchTopics();
        } catch { alert('Lỗi khi xóa'); }
    };

    const handleViewEntries = async (topicId: string, topicTitle: string) => {
        try {
            const res = await adminApi.get<{ entries: any[] }>(`/admin/collections/${topicId}/entries`);
            setViewEntries({ topicId, topicTitle, entries: res.entries });
        } catch { alert('Lỗi tải bài gửi'); }
    };

    const addMilestone = () => {
        const milestones = editTopic?.milestoneRewards || [];
        setEditTopic({
            ...editTopic,
            milestoneRewards: [...milestones, { target: (milestones.length + 1) * 5, coins: 50, xp: 20, gachaTickets: 0 }],
        });
    };

    const removeMilestone = (index: number) => {
        const milestones = [...(editTopic?.milestoneRewards || [])];
        milestones.splice(index, 1);
        setEditTopic({ ...editTopic, milestoneRewards: milestones });
    };

    const updateMilestone = (index: number, field: string, value: number) => {
        const milestones = [...(editTopic?.milestoneRewards || [])];
        (milestones[index] as any)[field] = value;
        setEditTopic({ ...editTopic, milestoneRewards: milestones });
    };

    return (
        <div className="collection-management-container">
            <div className="action-row" style={{ marginTop: 0 }}>
                <div></div>
                <button className="btn btn--primary" onClick={() => {
                    setEditTopic({ isActive: true, totalSlots: 20, order: topics.length, colorBg: '#10b981', colorAccent: '#ffffff', rewardPerEntry: { coins: 10, xp: 5, gachaTickets: 0 }, milestoneRewards: [] });
                    setShowModal(true);
                }}>
                    + Tạo Chủ Đề
                </button>
            </div>

            {/* Topics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 16 }}>
                {topics.map(topic => (
                    <div key={topic._id} className="card" style={{ borderTop: `4px solid ${topic.colorBg}` }}>
                        <div className="card__header" style={{ flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, backgroundColor: topic.colorBg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: topic.colorAccent,
                                    fontSize: 24, flexShrink: 0,
                                }}>
                                    📚
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="card__title" style={{ fontSize: 16, margin: 0 }}>{topic.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {topic.totalSlots} ô · Thứ tự: {topic.order}
                                        {!topic.isActive && <span className="badge badge--danger" style={{ marginLeft: 8 }}>Ẩn</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{topic.description || 'Chưa có mô tả'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                🎁 Mỗi mục: {topic.rewardPerEntry.coins}💰 {topic.rewardPerEntry.xp}⭐ {topic.rewardPerEntry.gachaTickets > 0 ? `${topic.rewardPerEntry.gachaTickets}🎟️` : ''}
                            </div>
                            {topic.milestoneRewards.length > 0 && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    🏆 Mốc: {topic.milestoneRewards.map(m => m.target).join(', ')}
                                </div>
                            )}
                            <div className="table-actions" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                                <button className="btn btn--secondary btn--sm" onClick={() => handleViewEntries(topic._id, topic.title)}>👁️ Xem bài gửi</button>
                                <button className="btn btn--secondary btn--sm" onClick={() => { setEditTopic(topic); setShowModal(true); }}>✏️ Sửa</button>
                                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(topic._id)}>🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {topics.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">📚</div>
                    <div className="empty-state__text">Chưa có chủ đề bộ sưu tập nào.</div>
                </div>
            )}

            {/* Entries Viewer Modal */}
            {viewEntries && (
                <div className="modal-backdrop" onClick={() => setViewEntries(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div className="modal__header">
                            <span className="modal__title">📋 Bài gửi: {viewEntries.topicTitle}</span>
                            <button className="modal__close" onClick={() => setViewEntries(null)}>×</button>
                        </div>
                        <div className="modal__body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {viewEntries.entries.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chưa có bài gửi nào</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {viewEntries.entries.map((entry: any) => (
                                        <div key={entry._id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
                                            {entry.imageUrl && <img src={entry.imageUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.title}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    Slot #{entry.slotIndex} · {entry.status === 'approved' ? '✅' : entry.status === 'rejected' ? '❌' : '⏳'}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    bởi {entry.userId?.username || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editTopic?._id ? '✏️ Sửa Chủ Đề' : '➕ Tạo Chủ Đề Mới'}</span>
                            <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>Tên Chủ Đề *</label>
                                <input type="text" value={editTopic?.title || ''} onChange={e => setEditTopic({ ...editTopic, title: e.target.value })} placeholder="VD: Cây cối quanh nhà" />
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea value={editTopic?.description || ''} onChange={e => setEditTopic({ ...editTopic, description: e.target.value })} placeholder="Mô tả chủ đề..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Số ô (slots) *</label>
                                    <input type="number" value={editTopic?.totalSlots || 20} onChange={e => setEditTopic({ ...editTopic, totalSlots: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Thứ tự hiển thị</label>
                                    <input type="number" value={editTopic?.order || 0} onChange={e => setEditTopic({ ...editTopic, order: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>URL ảnh chủ đề</label>
                                <input type="text" value={editTopic?.imageUrl || ''} onChange={e => setEditTopic({ ...editTopic, imageUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Màu nền</label>
                                    <input type="color" value={editTopic?.colorBg || '#10b981'} onChange={e => setEditTopic({ ...editTopic, colorBg: e.target.value })} style={{ height: 40 }} />
                                </div>
                                <div className="form-group">
                                    <label>Màu chữ</label>
                                    <input type="color" value={editTopic?.colorAccent || '#ffffff'} onChange={e => setEditTopic({ ...editTopic, colorAccent: e.target.value })} style={{ height: 40 }} />
                                </div>
                            </div>

                            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 16 }}>
                                <legend style={{ fontWeight: 'bold', padding: '0 8px' }}>🎁 Phần thưởng mỗi mục</legend>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                    <div className="form-group">
                                        <label>Coins</label>
                                        <input type="number" value={editTopic?.rewardPerEntry?.coins || 0} onChange={e => setEditTopic({ ...editTopic, rewardPerEntry: { ...(editTopic?.rewardPerEntry || { coins: 0, xp: 0, gachaTickets: 0 }), coins: Number(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label>XP</label>
                                        <input type="number" value={editTopic?.rewardPerEntry?.xp || 0} onChange={e => setEditTopic({ ...editTopic, rewardPerEntry: { ...(editTopic?.rewardPerEntry || { coins: 0, xp: 0, gachaTickets: 0 }), xp: Number(e.target.value) } })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Vé Gacha</label>
                                        <input type="number" value={editTopic?.rewardPerEntry?.gachaTickets || 0} onChange={e => setEditTopic({ ...editTopic, rewardPerEntry: { ...(editTopic?.rewardPerEntry || { coins: 0, xp: 0, gachaTickets: 0 }), gachaTickets: Number(e.target.value) } })} />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 16 }}>
                                <legend style={{ fontWeight: 'bold', padding: '0 8px' }}>🏆 Mốc thưởng chuỗi</legend>
                                {(editTopic?.milestoneRewards || []).map((m, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr 40px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: 11 }}>Mốc</label>
                                            <input type="number" value={m.target} onChange={e => updateMilestone(i, 'target', Number(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: 11 }}>Coins</label>
                                            <input type="number" value={m.coins} onChange={e => updateMilestone(i, 'coins', Number(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: 11 }}>XP</label>
                                            <input type="number" value={m.xp} onChange={e => updateMilestone(i, 'xp', Number(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: 11 }}>Vé</label>
                                            <input type="number" value={m.gachaTickets} onChange={e => updateMilestone(i, 'gachaTickets', Number(e.target.value))} />
                                        </div>
                                        <button className="btn btn--danger btn--sm" onClick={() => removeMilestone(i)} style={{ height: 36 }}>×</button>
                                    </div>
                                ))}
                                <button className="btn btn--secondary btn--sm" onClick={addMilestone}>+ Thêm mốc</button>
                            </fieldset>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="checkbox" checked={editTopic?.isActive ?? true} onChange={e => setEditTopic({ ...editTopic, isActive: e.target.checked })} />
                                    Hiển thị (Active)
                                </label>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : (editTopic?._id ? 'Cập nhật' : 'Tạo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
