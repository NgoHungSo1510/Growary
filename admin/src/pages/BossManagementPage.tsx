import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface BossEvent {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    maxHp: number;
    currentHp: number;
    baseRewardCoins: number;
    baseRewardXp?: number;
    gachaTickets: number;
    status: 'upcoming' | 'active' | 'completed' | 'failed';
    colorBg?: string;
    colorIcon?: string;
    iconName?: string;
    rewardItems?: string[];
    accumulatedCoins?: number;
}

export default function BossManagementPage() {
    const [events, setEvents] = useState<BossEvent[]>([]);
    const [rewardsList, setRewardsList] = useState<any[]>([]);
    const [editEvent, setEditEvent] = useState<Partial<BossEvent> | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchEvents = async () => {
        try {
            const [eventsRes, rewardsRes] = await Promise.all([
                adminApi.get<{ events: BossEvent[] }>('/admin/boss'),
                adminApi.getAllRewards()
            ]);
            setEvents(eventsRes.events);
            setRewardsList(rewardsRes.rewards);
        } catch (error) {
            console.error('Failed to fetch boss events', error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
        try {
            await adminApi.delete(`/admin/boss/${id}`);
            fetchEvents();
        } catch (error) {
            alert('Lỗi khi xóa sự kiện');
        }
    };

    const handleSave = async () => {
        if (!editEvent?.title || !editEvent?.maxHp || !editEvent?.startTime || !editEvent?.endTime) {
            alert('Vui lòng nhập đủ Tên, HP, và Thời gian');
            return;
        }

        try {
            setIsLoading(true);
            if (editEvent._id) {
                // Update
                await adminApi.put(`/admin/boss/${editEvent._id}`, editEvent);
            } else {
                // Create
                // If creating, set currentHp = maxHp initially
                const payload = { ...editEvent, currentHp: editEvent.maxHp };
                await adminApi.post('/admin/boss', payload);
            }
            setShowCreate(false);
            setEditEvent(null);
            fetchEvents();
        } catch (error: any) {
            alert(error.message || 'Lỗi lưu sự kiện');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await adminApi.put(`/admin/boss/${id}`, { status: newStatus });
            fetchEvents();
        } catch (error) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    return (
        <div className="boss-management-container">
            <div className="action-row" style={{ marginTop: 0 }}>
                <div></div>
                <button className="btn btn--primary" onClick={() => { setEditEvent({ status: 'upcoming', rewardItems: [] }); setShowCreate(true); }}>
                    + Tạo Sự Kiện Boss
                </button>
            </div>

            <div className="boss-timeline-wrapper" style={{ overflowX: 'auto', padding: '20px 0 60px 0', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative', minWidth: 'min-content', padding: '0 20px' }}>
                    {/* The continuous timeline track */}
                    <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 4, backgroundColor: 'var(--border)', zIndex: 0 }} />

                    {events.map((ev) => {
                        const start = new Date(ev.startTime).toLocaleDateString('vi-VN');
                        const end = new Date(ev.endTime).toLocaleDateString('vi-VN');

                        let statusBadge = <span className="badge badge--info">Sắp tới</span>;
                        if (ev.status === 'active') statusBadge = <span className="badge badge--primary">Đang mở</span>;
                        if (ev.status === 'completed') statusBadge = <span className="badge badge--success">Đã tiêu diệt</span>;
                        if (ev.status === 'failed') statusBadge = <span className="badge badge--danger">Thất bại</span>;

                        const hpPercent = Math.max(0, Math.min(100, (ev.currentHp / ev.maxHp) * 100));

                        return (
                            <div key={ev._id} style={{ position: 'relative', width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Timeline Node (The point on the line) */}
                                <div style={{
                                    width: 16, height: 16, borderRadius: '50%', backgroundColor: ev.colorBg || '#ef4444',
                                    position: 'absolute', top: 18, zIndex: 2, border: '4px solid var(--bg)',
                                    boxShadow: '0 0 0 2px var(--border)'
                                }} />

                                {/* Date range sitting on top of the line */}
                                <div style={{ color: ev.colorBg || 'var(--text)', fontWeight: 'bold', fontSize: 13, marginBottom: 28, zIndex: 1, backgroundColor: 'var(--bg)', padding: '0 8px' }}>
                                    {start} — {end}
                                </div>

                                {/* Link line from node down to the card */}
                                <div style={{ position: 'absolute', top: 24, width: 2, height: 40, backgroundColor: ev.colorBg || '#ef4444', zIndex: 0 }} />

                                {/* The Boss Card "Window" */}
                                <div className="card" style={{ width: '100%', marginTop: 24, borderTop: `4px solid ${ev.colorBg || '#ef4444'}`, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                                    <div className="card__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 10,
                                                backgroundColor: ev.colorBg || '#ef4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: ev.colorIcon || '#ffffff',
                                                fontSize: 24,
                                                flexShrink: 0,
                                                marginTop: 2
                                            }}>
                                                {/* Hidden icon due to font family issues, retaining color box to distinguish boss elements */}
                                                {/* <span style={{ fontFamily: 'Material Icons' }} className="material-icons">{ev.iconName || 'smart-toy'}</span> */}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="card__title" style={{ fontSize: 16, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4, margin: 0, paddingRight: 8 }}>{ev.title}</div>
                                            </div>
                                            <div style={{ flexShrink: 0, marginTop: 4 }}>{statusBadge}</div>
                                        </div>

                                        <div className="table-actions" style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                                            <select
                                                value={ev.status}
                                                onChange={(e) => handleStatusChange(ev._id, e.target.value)}
                                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12 }}
                                            >
                                                <option value="upcoming">Sắp tới</option>
                                                <option value="active">Kích hoạt</option>
                                                <option value="completed">Tiêu diệt</option>
                                                <option value="failed">Thất bại</option>
                                            </select>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn--secondary btn--sm" onClick={() => { setEditEvent(ev); setShowCreate(true); }}>✏️ Sửa</button>
                                                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(ev._id)}>🗑️</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {ev.description}
                                        </div>

                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            💰 Rương: <strong>{ev.baseRewardCoins + (ev.accumulatedCoins || 0)}</strong> (Gốc: {ev.baseRewardCoins})<br />
                                            🌟 XP: <strong>{ev.baseRewardXp || 0}</strong> | 🎟️ Vé: <strong>{ev.gachaTickets}</strong>
                                            {ev.rewardItems && ev.rewardItems.length > 0 && ` | 🎁 Quà: ${ev.rewardItems.length}`}
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontWeight: 'bold' }}>
                                                <span>HP Boss</span>
                                                <span style={{ color: '#ef4444' }}>{Math.floor(ev.currentHp)} / {ev.maxHp}</span>
                                            </div>
                                            <div style={{ height: 12, background: '#fee2e2', borderRadius: 6, overflow: 'hidden' }}>
                                                <div style={{ width: `${hpPercent}%`, height: '100%', background: '#ef4444', transition: 'width 0.3s' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {events.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state__icon">👾</div>
                        <div className="empty-state__text">Chưa có sự kiện Boss nào.</div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {(showCreate) && (
                <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editEvent?._id ? '✏️ CSS Sửa Boss' : '➕ Tạo Boss Mới'}</span>
                            <button className="modal__close" onClick={() => setShowCreate(false)}>×</button>
                        </div>
                        <div className="modal__body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>Tên Sự Kiện Boss</label>
                                <input
                                    type="text"
                                    value={editEvent?.title || ''}
                                    onChange={e => setEditEvent({ ...editEvent, title: e.target.value })}
                                    placeholder="VD: Tuần lễ diệt Lười Biếng"
                                />
                            </div>
                            <div className="form-group">
                                <label>Mô tả cốt truyện</label>
                                <textarea
                                    value={editEvent?.description || ''}
                                    onChange={e => setEditEvent({ ...editEvent, description: e.target.value })}
                                    placeholder="Giới thiệu về con Boss này..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Máu tối đa (Max HP)</label>
                                    <input
                                        type="number"
                                        value={editEvent?.maxHp || ''}
                                        onChange={e => setEditEvent({ ...editEvent, maxHp: Number(e.target.value) })}
                                        placeholder="10000"
                                    />
                                </div>
                                {editEvent?._id && (
                                    <div className="form-group">
                                        <label>Máu hiện tại (Current HP)</label>
                                        <input
                                            type="number"
                                            value={editEvent?.currentHp || ''}
                                            onChange={e => setEditEvent({ ...editEvent, currentHp: Number(e.target.value) })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Thời gian bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        value={editEvent?.startTime ? new Date(editEvent.startTime).toISOString().slice(0, 16) : ''}
                                        onChange={e => setEditEvent({ ...editEvent, startTime: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Thời gian kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        value={editEvent?.endTime ? new Date(editEvent.endTime).toISOString().slice(0, 16) : ''}
                                        onChange={e => setEditEvent({ ...editEvent, endTime: new Date(e.target.value).toISOString() })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Coins Thưởng Cơ Bản</label>
                                    <input
                                        type="number"
                                        value={editEvent?.baseRewardCoins || 0}
                                        onChange={e => setEditEvent({ ...editEvent, baseRewardCoins: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>XP Thưởng Cơ Bản</label>
                                    <input
                                        type="number"
                                        value={editEvent?.baseRewardXp || 0}
                                        onChange={e => setEditEvent({ ...editEvent, baseRewardXp: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vé Quay Gacha</label>
                                    <input
                                        type="number"
                                        value={editEvent?.gachaTickets || 0}
                                        onChange={e => setEditEvent({ ...editEvent, gachaTickets: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 8 }}>
                                <label>🎁 Quà tặng khi Tiêu diệt (Product Tickets)</label>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                    Chọn các phần quà từ cửa hàng để tặng người chơi (chui vào kho không tốn coin).
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                                    maxHeight: 240, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--card-border)'
                                }}>
                                    {rewardsList.map(r => {
                                        const isSelected = (editEvent?.rewardItems || []).includes(r._id);
                                        return (
                                            <div
                                                key={r._id}
                                                onClick={() => {
                                                    const current = editEvent?.rewardItems || [];
                                                    const updated = isSelected ? current.filter(id => id !== r._id) : [...current, r._id];
                                                    setEditEvent({ ...editEvent, rewardItems: updated });
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, padding: 8,
                                                    background: isSelected ? 'var(--accent-light)' : 'white',
                                                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                                                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {r.imageUrl ? <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, background: '#eee', borderRadius: 6 }}></div>}
                                                <div style={{ flex: 1, fontSize: 13 }}>
                                                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                                                </div>
                                                <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                                                    {isSelected && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Màu nền (Background Hex)</label>
                                    <input
                                        type="text"
                                        value={editEvent?.colorBg || '#ef4444'}
                                        onChange={e => setEditEvent({ ...editEvent, colorBg: e.target.value })}
                                        placeholder="#ef4444"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Màu Icon Boss (Hex)</label>
                                    <input
                                        type="text"
                                        value={editEvent?.colorIcon || '#ffffff'}
                                        onChange={e => setEditEvent({ ...editEvent, colorIcon: e.target.value })}
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Tên Icon (Material Icons)</label>
                                    <input
                                        type="text"
                                        value={editEvent?.iconName || 'smart-toy'}
                                        onChange={e => setEditEvent({ ...editEvent, iconName: e.target.value })}
                                        placeholder="smart-toy"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Xem trước Boss</label>
                                    <div style={{
                                        height: 120,
                                        borderRadius: 16,
                                        backgroundColor: editEvent?.colorBg || '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: editEvent?.colorIcon || '#ffffff',
                                        fontSize: 64
                                    }}>
                                        <span style={{ fontFamily: 'Material Icons' }}>{editEvent?.iconName || 'smart-toy'}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreate(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : (editEvent?._id ? 'Cập nhật' : 'Tạo Boss')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
