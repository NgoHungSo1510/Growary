import { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import BossCollectionManagement from '../components/BossCollectionManagement';

export default function BossManagementPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [weeks, setWeeks] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editEvent, setEditEvent] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const poolBosses = events.filter(ev => ev.status === 'pool');
    const upcomingBosses = events.filter(ev => ev.status === 'upcoming');

    const fetchEvents = async () => {
        try {
            const [evRes, weekRes, colRes] = await Promise.all([
                adminApi.get<{ events: any[] }>('/admin/boss'),
                adminApi.get<{ weeks: any[] }>('/admin/boss-weekly-history'),
                adminApi.get<{ collections: any[] }>('/admin/boss-collections')
            ]);
            setEvents(evRes.events || []);
            setWeeks(weekRes.weeks || []);
            setCollections(colRes.collections || []);
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

    const handleSave = async () => {
        if (!editEvent?.title || !editEvent?.maxHp) {
            alert('Vui lòng nhập đủ Tên và HP');
            return;
        }

        try {
            setIsLoading(true);
            if (editEvent._id) {
                await adminApi.put(`/admin/boss/${editEvent._id}`, editEvent);
            } else {
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
            setEvents((prev: any) => prev.map((ev: any) => ev._id === id ? { ...ev, status: newStatus } : ev));
            await adminApi.put(`/admin/boss/${id}`, { status: newStatus });
            fetchEvents();
        } catch (error) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result as string;
                const res = await adminApi.post<{ url: string }>('/upload/image', { image: base64Image });
                if (res.url) {
                    setEditEvent((prev: any) => prev ? { ...prev, avatarImageUrl: res.url } : prev);
                }
            };
        } catch (error) {
            alert('Upload ảnh thất bại!');
        } finally {
            setIsLoading(false);
        }
    };

    // Quiz functions
    const addQuestion = () => {
        setEditEvent((prev: any) => ({
            ...prev,
            miniGameQuestions: [...(prev?.miniGameQuestions || []), { question: '', options: ['', '', '', ''], correctIndex: 0 }]
        }));
    };

    const removeQuestion = (idx: number) => {
        setEditEvent((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                miniGameQuestions: prev.miniGameQuestions?.filter((_: any, i: number) => i !== idx)
            };
        });
    };

    const updateQuestion = (idx: number, field: string, value: any) => {
        setEditEvent((prev: any) => {
            if (!prev) return prev;
            const qs = [...(prev.miniGameQuestions || [])];
            qs[idx] = { ...qs[idx], [field]: value };
            return { ...prev, miniGameQuestions: qs };
        });
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        setEditEvent((prev: any) => {
            if (!prev) return prev;
            const qs = [...(prev.miniGameQuestions || [])];
            const opts = [...qs[qIdx].options];
            opts[optIdx] = value;
            qs[qIdx] = { ...qs[qIdx], options: opts };
            return { ...prev, miniGameQuestions: qs };
        });
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
                    {weeks.map((week, wIdx) => (
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

                    {weeks.length === 0 && poolBosses.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                            <span className="material-icons" style={{ fontSize: 48, color: '#94a3b8', marginBottom: 12 }}>smart_toy</span>
                            <div style={{ color: '#64748b', fontSize: 14 }}>Chưa có sự kiện Nhân vật nào.</div>
                        </div>
                    )}
                </div>
            </div>

            <BossCollectionManagement events={events} onEditBoss={ev => { setEditEvent(ev); setShowCreate(true); }} />

            {/* Modal */}
            {(showCreate) && (
                <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editEvent?._id ? '✏️ Chỉnh sửa Sự Kiện Nhân Vật' : '➕ Tạo Sự Kiện Nhân Vật Mới'}</span>
                            <button className="modal__close" onClick={() => setShowCreate(false)}>×</button>
                        </div>
                        <div className="modal__body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                                {/* Section 1: Basic & V2 Identity */}
                                <div>
                                    <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--accent)' }}>1. Thông tin cơ bản</h3>

                                    <div className="form-group">
                                        <label>URL Ảnh Đại Diện Nhân Vật</label>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            {editEvent?.avatarImageUrl && (
                                                <img
                                                    src={editEvent.avatarImageUrl}
                                                    style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: `2px solid ${editEvent?.colorBg || '#ef4444'}` }}
                                                    alt="preview"
                                                />
                                            )}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                                <input
                                                    type="text"
                                                    value={editEvent?.avatarImageUrl || ''}
                                                    onChange={e => setEditEvent({ ...editEvent, avatarImageUrl: e.target.value })}
                                                    placeholder="Hoặc dán URL: https://..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="checkbox"
                                            id="isLimited"
                                            checked={editEvent?.isLimited ?? false}
                                            onChange={e => setEditEvent({ ...editEvent, isLimited: e.target.checked })}
                                        />
                                        <label htmlFor="isLimited" style={{ margin: 0 }}>Nhân vật sự kiện giới hạn (Chỉ xuất hiện 1 lần)</label>
                                    </div>

                                    <div className="form-group">
                                        <label>Thuộc Bộ sưu tập</label>
                                        <select
                                            value={editEvent?.collectionId || ''}
                                            onChange={e => setEditEvent({ ...editEvent, collectionId: e.target.value })}
                                            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
                                        >
                                            <option value="">-- Không thuộc bộ nào --</option>
                                            {collections.map(col => (
                                                <option key={col._id} value={col._id}>{col.iconEmoji} {col.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Tên Sự Kiện Nhân Vật</label>
                                        <input
                                            type="text"
                                            value={editEvent?.title || ''}
                                            onChange={e => setEditEvent({ ...editEvent, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Mô tả ngắn gọn (Sự kiện)</label>
                                        <textarea
                                            value={editEvent?.description || ''}
                                            onChange={e => setEditEvent({ ...editEvent, description: e.target.value })}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Ảnh đại diện nhân vật (URL)</label>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            {editEvent?.avatarImageUrl && (
                                                <img src={editEvent.avatarImageUrl} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                            )}
                                            <input
                                                type="text"
                                                placeholder="https://..."
                                                value={editEvent?.avatarImageUrl || ''}
                                                onChange={e => setEditEvent({ ...editEvent, avatarImageUrl: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Tên cốt truyện (VD: Bí Ẩn Doraemon)</label>
                                        <input
                                            type="text"
                                            value={editEvent?.loreTitle || ''}
                                            onChange={e => setEditEvent({ ...editEvent, loreTitle: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Nội dung cốt truyện (Hiển thị khi phá khóa)</label>
                                        <textarea
                                            rows={4}
                                            value={editEvent?.loreContent || ''}
                                            onChange={e => setEditEvent({ ...editEvent, loreContent: e.target.value })}
                                        />
                                    </div>

                                    <h3 style={{ fontSize: 16, marginTop: 24, marginBottom: 16, color: 'var(--accent)' }}>2. Phần thưởng & Chỉ số</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>Máu (Max HP)</label>
                                            <input
                                                type="number"
                                                value={editEvent?.maxHp || ''}
                                                onChange={e => setEditEvent({ ...editEvent, maxHp: Number(e.target.value) })}
                                            />
                                        </div>
                                        {editEvent?._id && (
                                            <div className="form-group">
                                                <label>Current HP</label>
                                                <input
                                                    type="number"
                                                    value={editEvent?.currentHp || ''}
                                                    onChange={e => setEditEvent({ ...editEvent, currentHp: Number(e.target.value) })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>Trạng thái</label>
                                            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                                                {editEvent?.status === 'active' ? 'Đang mở (Active)' : editEvent?.status === 'completed' ? 'Đã tiêu diệt' : editEvent?.status === 'failed' ? 'Thất bại' : 'Trong Pool'}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Tuần Active</label>
                                            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                                                {editEvent?.weekActivatedAt ? new Date(editEvent.weekActivatedAt).toLocaleDateString('vi-VN') : 'Chưa bao giờ'}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Số lần trả về Pool</label>
                                            <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)' }}>
                                                {editEvent?.timesReturned || 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>Coins</label>
                                            <input type="number" value={editEvent?.baseRewardCoins || 0} onChange={e => setEditEvent({ ...editEvent, baseRewardCoins: Number(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label>XP</label>
                                            <input type="number" value={editEvent?.baseRewardXp || 0} onChange={e => setEditEvent({ ...editEvent, baseRewardXp: Number(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Gacha</label>
                                            <input type="number" value={editEvent?.gachaTickets || 0} onChange={e => setEditEvent({ ...editEvent, gachaTickets: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Mini-Game & Styling */}
                                <div>
                                    <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--accent)' }}>3. Cơ Chế Minigame</h3>

                                    <div className="form-group">
                                        <label>Loại Cơ Chế (Đánh Khóa)</label>
                                        <select
                                            value={editEvent?.miniGameType || 'random'}
                                            onChange={e => setEditEvent({ ...editEvent, miniGameType: e.target.value })}
                                            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
                                        >
                                            <option value="random">Ngẫu nhiên</option>
                                            <option value="tap">Bấm liên tục (Tap)</option>
                                            <option value="reflex">Phản xạ (Reflex)</option>
                                            <option value="quiz">Giải đố (Quiz)</option>
                                        </select>
                                    </div>

                                    <h4 style={{ fontSize: 14, marginTop: 24, marginBottom: 8 }}>Câu Hỏi Mini-Game (Quick Quiz)</h4>
                                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                        Chỉ dùng nếu cơ chế là Random hoặc Quiz.
                                    </p>

                                    {(editEvent?.miniGameQuestions || []).map((q: any, idx: number) => (
                                        <div key={idx} style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <strong>Câu hỏi {idx + 1}</strong>
                                                <button className="btn btn--danger btn--sm" onClick={() => removeQuestion(idx)}>Xóa</button>
                                            </div>
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    placeholder="Nội dung câu hỏi"
                                                    value={q.question}
                                                    onChange={e => updateQuestion(idx, 'question', e.target.value)}
                                                />
                                            </div>
                                            {['A', 'B', 'C', 'D'].map((opt, optIdx) => (
                                                <div key={optIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${idx}`}
                                                        checked={q.correctIndex === optIdx}
                                                        onChange={() => updateQuestion(idx, 'correctIndex', optIdx)}
                                                    />
                                                    <span style={{ fontWeight: 'bold' }}>{opt}:</span>
                                                    <input
                                                        type="text"
                                                        placeholder={`Đáp án ${opt}`}
                                                        value={q.options[optIdx] || ''}
                                                        onChange={e => updateOption(idx, optIdx, e.target.value)}
                                                        style={{ flex: 1, padding: '4px 8px' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    <button className="btn btn--secondary" onClick={addQuestion} style={{ width: '100%', marginBottom: 24 }}>+ Thêm câu hỏi</button>


                                    <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--accent)' }}>4. Tùy chỉnh (Dự phòng)</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label>Màu nền (Hex)</label>
                                            <input type="text" value={editEvent?.colorBg || '#ef4444'} onChange={e => setEditEvent({ ...editEvent, colorBg: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Màu Icon Nhân vật</label>
                                            <input type="text" value={editEvent?.colorIcon || '#ffffff'} onChange={e => setEditEvent({ ...editEvent, colorIcon: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowCreate(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : (editEvent?._id ? 'Cập nhật Nhân vật' : 'Tạo Nhân vật')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
