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
    completionRewardPool: { coins: number; xp: number; gachaTickets: number };
    rewardPerEntry: { coins: number; xp: number; gachaTickets: number };
    milestoneRewards: { target: number; coins: number; xp: number; gachaTickets: number }[];
    isActive: boolean;
    isCompleted: boolean;
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

    // Group entries by user
    const groupedEntries = () => {
        if (!viewEntries) return [];
        const groups: Record<string, { user: any, entries: any[] }> = {};
        viewEntries.entries.forEach(entry => {
            const userId = entry.userId?._id || 'unknown';
            if (!groups[userId]) {
                groups[userId] = {
                    user: entry.userId || { username: 'Unknown User' },
                    entries: []
                };
            }
            groups[userId].entries.push(entry);
        });
        return Object.values(groups);
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff7cf', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, color: '#332f13', fontSize: '28px', fontWeight: 900 }}>Bộ Sưu Tập (Global)</h1>
                <button 
                    onClick={() => {
                        setEditTopic({ 
                            isActive: true, 
                            isCompleted: false,
                            totalSlots: 20, 
                            order: topics.length + 1, 
                            colorBg: '#fd7d9f', 
                            colorAccent: '#ffffff', 
                            rewardPerEntry: { coins: 10, xp: 5, gachaTickets: 0 }, 
                            milestoneRewards: [] 
                        });
                        setShowModal(true);
                    }}
                    style={{ backgroundColor: '#9f3456', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 16px rgba(159,52,86,0.3)' }}
                >
                    + Create Topic
                </button>
            </div>

            {/* Topics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                {topics.map(topic => (
                    <div key={topic._id} style={{ 
                        backgroundColor: '#fff', borderRadius: '24px', padding: '24px', 
                        boxShadow: '0 10px 30px rgba(51,47,19,0.05)', position: 'relative', overflow: 'hidden',
                        opacity: topic.isCompleted ? 0.7 : 1
                    }}>
                        {/* Status Badge */}
                        <div style={{ position: 'absolute', top: 16, right: 16, backgroundColor: topic.isCompleted ? '#10b981' : (topic.isActive ? '#fd9c90' : '#fb5151'), color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            {topic.isCompleted ? 'Completed' : (topic.isActive ? 'Active' : 'Inactive')}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ 
                                width: 64, height: 64, borderRadius: '16px', backgroundColor: topic.colorBg || '#fd7d9f', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px',
                                boxShadow: `0 8px 16px ${topic.colorBg}40`
                            }}>
                                📸
                            </div>
                            <div style={{ flex: 1, paddingRight: 60 }}>
                                <h3 style={{ margin: '0 0 4px 0', color: '#332f13', fontSize: '18px', fontWeight: 800 }}>Tầng {topic.order}: {topic.title}</h3>
                                <p style={{ margin: 0, color: '#615c3c', fontSize: '13px', lineHeight: 1.4 }}>{topic.description || 'No description provided.'}</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', backgroundColor: '#faf2c4', padding: '16px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#615c3c', fontSize: '13px', fontWeight: 600 }}>Cần thu thập: <strong style={{ color: '#9f3456' }}>{topic.totalSlots} ô</strong></span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#615c3c', fontWeight: 600, borderTop: '1px solid #e7dea9', paddingTop: '8px' }}>
                                🎁 Điểm gốc (Mỗi slot): {topic.rewardPerEntry?.coins||0}💰 {topic.rewardPerEntry?.xp||0}⭐ {topic.rewardPerEntry?.gachaTickets > 0 ? `${topic.rewardPerEntry.gachaTickets}🎟️` : ''}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button onClick={() => handleViewEntries(topic._id, topic.title)} style={{ flex: 1, backgroundColor: '#ece4b1', color: '#4f2b13', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>👁️ Xem đóng góp</button>
                            <button onClick={() => { setEditTopic(topic); setShowModal(true); }} style={{ flex: 1, backgroundColor: '#ffc5a4', color: '#653e24', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>✏️ Sửa</button>
                            <button onClick={() => handleDelete(topic._id)} style={{ width: '40px', backgroundColor: '#ffefee', color: '#b31b25', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Entries Viewer Modal - Grouped By User */}
            {viewEntries && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(51,47,19,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: '#fff7cf', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e7dea9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#332f13' }}>📸 Chi tiết bộ: {viewEntries.topicTitle}</span>
                            <button onClick={() => setViewEntries(null)} style={{ background: 'transparent', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#9f3456' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {viewEntries.entries.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#a09d84', padding: '32px', fontSize: 16 }}>Chưa có ai đóng góp.</div>
                            ) : (
                                groupedEntries().map((group, idx) => (
                                    <div key={idx} style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 12px rgba(51,47,19,0.05)' }}>
                                        {/* User Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed #e7dea9' }}>
                                            <div style={{ width: 44, height: 44, borderRadius: '22px', backgroundColor: '#faf2c4', overflow: 'hidden' }}>
                                                {group.user.avatar ? (
                                                    <img src={group.user.avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                ) : (
                                                    <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>👤</div>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px', color: '#332f13' }}>{group.user.username} {group.user.email ? `(${group.user.email})` : ''}</div>
                                                <div style={{ fontSize: '12px', color: '#9f3456', fontWeight: 600 }}>Tổng đóng góp: {group.entries.length} ảnh</div>
                                            </div>
                                        </div>

                                        {/* User Entries Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                                            {group.entries.map((entry: any) => (
                                                <div key={entry._id} style={{ border: '1px solid #e7dea9', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#faf2c4' }}>
                                                    {entry.imageUrl ? (
                                                        <img src={entry.imageUrl} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{width:'100%', height:'100px', display:'flex', alignItems:'center', justifyContent:'center', color: '#a09d84'}}>No Image</div>
                                                    )}
                                                    <div style={{ padding: '8px' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#332f13', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</div>
                                                        <div style={{ fontSize: '11px', color: '#615c3c', marginTop: '2px' }}>
                                                            Ô #{entry.slotIndex + 1}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(51,47,19,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #faf2c4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, color: '#332f13', fontSize: '20px', fontWeight: 800 }}>{editTopic?._id ? '✏️ Edit Topic' : '➕ Create New Topic'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#615c3c' }}>×</button>
                        </div>
                        
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4f2b13', fontSize: '14px' }}>Topic Name *</label>
                                <input type="text" value={editTopic?.title || ''} onChange={e => setEditTopic({ ...editTopic, title: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e7dea9', backgroundColor: '#faf2c4', fontSize: '15px' }} placeholder="e.g. Summer Memories" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4f2b13', fontSize: '14px' }}>Description</label>
                                <textarea value={editTopic?.description || ''} onChange={e => setEditTopic({ ...editTopic, description: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e7dea9', backgroundColor: '#faf2c4', fontSize: '15px', minHeight: '80px' }} placeholder="Cùng mọi người khám phá..." />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4f2b13', fontSize: '14px' }}>Tổng số khay thu thập *</label>
                                    <input type="number" value={editTopic?.totalSlots || 20} onChange={e => setEditTopic({ ...editTopic, totalSlots: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e7dea9', backgroundColor: '#faf2c4', fontSize: '15px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#4f2b13', fontSize: '14px' }}>Tầng (Order) *</label>
                                    <input type="number" value={editTopic?.order || 1} onChange={e => setEditTopic({ ...editTopic, order: Number(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e7dea9', backgroundColor: '#faf2c4', fontSize: '15px' }} />
                                </div>
                            </div>
                            
                            <div style={{ backgroundColor: '#fff7cf', padding: '16px', borderRadius: '16px', border: '1px solid #e7dea9' }}>
                                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#332f13', fontSize: '14px' }}>🎁 Điểm tĩnh (Tặng mỗi ảnh được gửi vào khay)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#615c3c', marginBottom: '4px', display: 'block' }}>Coins</label>
                                        <input type="number" value={editTopic?.rewardPerEntry?.coins || 0} onChange={e => setEditTopic({ ...editTopic, rewardPerEntry: { ...(editTopic?.rewardPerEntry || { coins: 0, xp: 0, gachaTickets: 0 }), coins: Number(e.target.value) } })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#615c3c', marginBottom: '4px', display: 'block' }}>XP</label>
                                        <input type="number" value={editTopic?.rewardPerEntry?.xp || 0} onChange={e => setEditTopic({ ...editTopic, rewardPerEntry: { ...(editTopic?.rewardPerEntry || { coins: 0, xp: 0, gachaTickets: 0 }), xp: Number(e.target.value) } })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#615c3c', marginBottom: '4px', display: 'block' }}>Gacha Tkts</label>
                                        <input type="number" value={editTopic?.rewardPerEntry?.gachaTickets || 0} onChange={e => setEditTopic({ ...editTopic, rewardPerEntry: { ...(editTopic?.rewardPerEntry || { coins: 0, xp: 0, gachaTickets: 0 }), gachaTickets: Number(e.target.value) } })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                    </div>
                                </div>
                            </div>
                            


                            <div style={{ backgroundColor: '#fff7cf', padding: '16px', borderRadius: '16px', border: '1px solid #e7dea9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label style={{ fontWeight: 'bold', color: '#4f2b13', fontSize: '14px', margin: 0 }}>🏆 Cột mốc cá nhân (Trúng bấy nhiêu ảnh thì thưởng)</label>
                                    <button onClick={addMilestone} style={{ backgroundColor: '#ffc5a4', color: '#653e24', border: 'none', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add</button>
                                </div>
                                
                                {(editTopic?.milestoneRewards || []).map((m, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 30px', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                                        <input type="number" value={m.target} placeholder="Target" onChange={e => updateMilestone(i, 'target', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                        <input type="number" value={m.coins} placeholder="Coins" onChange={e => updateMilestone(i, 'coins', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                        <input type="number" value={m.xp} placeholder="XP" onChange={e => updateMilestone(i, 'xp', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                        <input type="number" value={m.gachaTickets} placeholder="Tkts" onChange={e => updateMilestone(i, 'gachaTickets', Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e7dea9' }} />
                                        <button onClick={() => removeMilestone(i)} style={{ backgroundColor: '#ffefee', color: '#b31b25', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>×</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#332f13' }}>
                                    <input type="checkbox" checked={editTopic?.isActive ?? true} onChange={e => setEditTopic({ ...editTopic, isActive: e.target.checked })} style={{ width: 20, height: 20, accentColor: '#9f3456' }} />
                                    Active 🟢
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#332f13' }}>
                                    <input type="checkbox" checked={editTopic?.isCompleted ?? false} onChange={e => setEditTopic({ ...editTopic, isCompleted: e.target.checked })} style={{ width: 20, height: 20, accentColor: '#10b981' }} />
                                    Đã Hoàn Thành ✅ (Đóng tầng)
                                </label>
                            </div>
                        </div>
                        
                        <div style={{ padding: '20px 24px', borderTop: '1px solid #faf2c4', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#ece4b1', color: '#4f2b13', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSave} disabled={isLoading} style={{ backgroundColor: '#9f3456', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {isLoading ? 'Saving...' : 'Save Topic'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
