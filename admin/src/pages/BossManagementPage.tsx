import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import BossCollectionManagement from '../components/BossCollectionManagement';
import BossFormModal from '../components/boss/BossFormModal';

export default function BossManagementPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [weeks, setWeeks] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [mysteryBoxes, setMysteryBoxes] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editEvent, setEditEvent] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAllWeeks, setShowAllWeeks] = useState(false);

    const poolBosses = events.filter(ev => ev.status === 'pool');
    const upcomingBosses = events.filter(ev => ev.status === 'upcoming');

    const fetchEvents = async () => {
        try {
            const [evRes, weekRes, colRes, boxRes] = await Promise.all([
                adminApi.get<{ events: any[] }>('/admin/boss'),
                adminApi.get<{ weeks: any[] }>('/admin/boss-weekly-history'),
                adminApi.get<{ collections: any[] }>('/admin/boss-collections'),
                adminApi.getMysteryBoxes()
            ]);
            setEvents(evRes.events || []);
            setWeeks(weekRes.weeks || []);
            setCollections(colRes.collections || []);
            setMysteryBoxes(boxRes.boxes || []);
        } catch (error) {
            console.error('Failed to fetch boss data', error);
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

    const handleSave = async (savedEvent: any) => {
        try {
            setIsLoading(true);
            if (savedEvent._id) {
                await adminApi.put(`/admin/boss/${savedEvent._id}`, savedEvent);
            } else {
                const payload = { ...savedEvent, currentHp: savedEvent.maxHp };
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
            setEvents((prev: any) => prev.map((ev: any) => ev._id === id ? { ...ev, status: newStatus } : ev));
            await adminApi.put(`/admin/boss/${id}`, { status: newStatus });
            fetchEvents();
        } catch (error) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    const renderBossCard = (ev: any, start: string) => {
        let statusBadge = <span className="badge badge--info">Trong Pool</span>;
        if (ev.status === 'active') statusBadge = <span className="badge badge--primary">Đang mở</span>;
        if (ev.status === 'upcoming') statusBadge = <span className="badge badge--warning">Sắp tới</span>;
        if (ev.status === 'completed') statusBadge = <span className="badge badge--success">Đã tiêu diệt</span>;
        if (ev.status === 'failed') statusBadge = <span className="badge badge--danger">Thất bại</span>;

        const hpPercent = Math.max(0, Math.min(100, (ev.currentHp / ev.maxHp) * 100));
        const evColor = '#ef4444';

        return (
            <div key={ev._id} style={{ position: 'relative', width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: 16, height: 16, borderRadius: '50%', backgroundColor: evColor,
                    position: 'absolute', top: 18, zIndex: 2, border: '4px solid var(--bg)',
                    boxShadow: '0 0 0 2px var(--border)'
                }} />
                <div style={{ color: evColor, fontWeight: 'bold', fontSize: 13, marginBottom: 28, zIndex: 1, backgroundColor: 'var(--bg)', padding: '0 8px' }}>
                    {start}
                </div>
                <div style={{ position: 'absolute', top: 24, width: 2, height: 40, backgroundColor: evColor, zIndex: 0 }} />

                <div className="card" style={{ width: '100%', marginTop: 24, borderTop: `4px solid ${evColor}`, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <div className="card__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                            {ev.avatarImageUrl ? (
                                <img src={ev.avatarImageUrl} style={{ width: 120, height: 120, borderRadius: 16, objectFit: 'cover', marginTop: 2, flexShrink: 0, border: `2px solid ${evColor}` }} alt="character" />
                            ) : (
                                <div style={{
                                    width: 120, height: 120, borderRadius: 16, backgroundColor: evColor,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: ev.colorIcon || '#ffffff', fontSize: 32, flexShrink: 0, marginTop: 2
                                }}></div>
                            )}

                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div className="card__title" style={{ fontSize: 18, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4, margin: 0 }}>{ev.title}</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {ev.isLimited && <span className="badge badge--danger" style={{ fontSize: 10, padding: '2px 4px' }}>Limited</span>}
                                    {ev.collectionId && <span className="badge badge--warning" style={{ fontSize: 10, padding: '2px 4px' }}>Bộ sưu tập</span>}
                                    {ev.loreTitle && <span className="badge badge--primary" style={{ fontSize: 10, padding: '2px 4px' }}>Cốt truyện</span>}
                                    <span className="badge badge--info" style={{ fontSize: 10, padding: '2px 4px', background: '#3b82f6', color: '#fff' }}>
                                        Cơ chế: {ev.miniGameType === 'tap' ? 'Tap' : ev.miniGameType === 'reflex' ? 'Reflex' : ev.miniGameType === 'quiz' ? 'Quiz' : 'Random'}
                                    </span>
                                </div>
                                <div style={{ alignSelf: 'flex-start' }}>{statusBadge}</div>
                            </div>
                        </div>

                        <div className="table-actions" style={{ width: '100%', justifyContent: 'space-between', marginTop: 8 }}>
                            <select
                                value={ev.status}
                                onChange={(e) => handleStatusChange(ev._id, e.target.value)}
                                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12 }}
                            >
                                <option value="pool">Trong Pool</option>
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
                                <span>HP Nhân vật</span>
                                <span style={{ color: evColor }}>{Math.floor(ev.currentHp)} / {ev.maxHp}</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-bar__fill" style={{ width: `${hpPercent}%`, backgroundColor: evColor }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="boss-management-container">
            <div className="action-row" style={{ marginTop: 0, justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>Quản lý Sự kiện Nhân vật</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--secondary" onClick={async () => {
                        if (window.confirm('Xóc lại 2 nhân vật Sắp tới (Preview)? Hành động này sẽ đẩy 2 nhân vật Preview hiện tại về Pool và chọn ngẫu nhiên 2 nhân vật khác.')) {
                            try {
                                await adminApi.post('/admin/boss-reroll-preview', {});
                                alert('Đã xóc lại Preview thành công!');
                                fetchEvents();
                            } catch (error) {
                                alert('Lỗi xóc lại Preview');
                            }
                        }
                    }}>
                        🎲 Reroll Preview
                    </button>
                    <button className="btn btn--danger" onClick={async () => {
                        if (window.confirm('Tiến hành xoay vòng boss thủ công? Tính năng này chỉ dùng để test.')) {
                            try {
                                await adminApi.post('/admin/boss-manual-rotate', {});
                                alert('Đã xoay vòng thành công!');
                                fetchEvents();
                            } catch (error) {
                                alert('Lỗi xoay vòng');
                            }
                        }
                    }}>
                        🔄 Xoay vòng thủ công
                    </button>
                    <button className="btn btn--primary" onClick={() => { setEditEvent({ status: 'pool', rewardItems: [], isLimited: false, miniGameQuestions: [] }); setShowCreate(true); }}>
                        + Tạo Nhân Vật Mới
                    </button>
                </div>
            </div>

            <div className="boss-timeline-wrapper" style={{ overflowX: 'auto', padding: '20px 0 60px 0', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40, minWidth: 'min-content', padding: '0 20px' }}>

                    {/* Upcoming Bosses (Preview) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--warning)' }}>
                            🔮 Sắp Tới (Preview tuần sau)
                        </div>
                        {upcomingBosses.length > 0 ? (
                            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 4, backgroundColor: 'var(--border)', zIndex: 0 }} />
                                {upcomingBosses.map(ev => renderBossCard(ev, 'Tuần sau'))}
                            </div>
                        ) : (
                            <div style={{ padding: 20, border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)' }}>
                                Chưa có nhân vật nào trong hàng chờ Preview. Hãy nhấn Reroll Preview để tạo ngẫu nhiên.
                            </div>
                        )}
                    </div>

                    {/* Pool Summary */}
                    {poolBosses.length > 0 && (
                        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                            🎲 Có <strong>{poolBosses.length}</strong> nhân vật đang trong Pool chờ được xóc vào hàng chờ Sắp Tới.
                        </div>
                    )}

                    {/* Timeline */}
                    {(showAllWeeks ? weeks : weeks.slice(0, 2)).map((week, wIdx) => (
                        <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--accent)' }}>
                                📅 {week.weekLabel} (Bắt đầu: {new Date(week.weekStart).toLocaleDateString('vi-VN')})
                            </div>
                            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 4, backgroundColor: 'var(--border)', zIndex: 0 }} />
                                {week.bosses.map((ev: any) => {
                                    const start = ev.weekActivatedAt ? new Date(ev.weekActivatedAt).toLocaleDateString('vi-VN') : '';
                                    return renderBossCard(ev, start);
                                })}
                            </div>
                        </div>
                    ))}

                    {weeks.length > 2 && (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <button className="btn btn--secondary" onClick={() => setShowAllWeeks(!showAllWeeks)}>
                                {showAllWeeks ? 'Thu gọn lịch sử' : `Xem thêm lịch sử cũ (${weeks.length - 2} tuần)`}
                            </button>
                        </div>
                    )}

                    {weeks.length === 0 && poolBosses.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                            <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', marginBottom: 12 }}>smart_toy</span>
                            <div style={{ color: '#64748b', fontSize: 14 }}>Chưa có sự kiện Nhân vật nào.</div>
                        </div>
                    )}
                </div>
            </div>

            <BossCollectionManagement events={events} onEditBoss={ev => { setEditEvent(ev); setShowCreate(true); }} />

            {/* Boss Form Modal */}
            <BossFormModal
                isOpen={showCreate}
                editEvent={editEvent}
                collections={collections}
                mysteryBoxes={mysteryBoxes}
                isLoading={isLoading}
                onClose={() => setShowCreate(false)}
                onSave={handleSave}
            />
        </div>
    );
}
