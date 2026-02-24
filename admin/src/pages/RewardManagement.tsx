import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

interface RewardItem {
    _id: string;
    title: string;
    imageUrl?: string;
    pointCost: number;
}

interface Level {
    _id: string;
    level: number;
    xpRequired: number;
    coinReward: number;
    gachaTickets?: number;
    rewardItems?: RewardItem[];
    unlockDescription: string;
}

interface Milestone {
    _id: string;
    type: 'streak' | 'spending';
    target: number;
    coins: number;
    gachaTickets: number;
    rewardItems: RewardItem[];
}

type Tab = 'levels' | 'streak' | 'spending';

export default function RewardManagement() {
    const [tab, setTab] = useState<Tab>('levels');
    const [levels, setLevels] = useState<Level[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [rewardsList, setRewardsList] = useState<RewardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState<Milestone | null>(null);
    const [editLevelMode, setEditLevelMode] = useState<Level | null>(null);
    const [showLevelModal, setShowLevelModal] = useState(false);

    const [form, setForm] = useState({
        type: 'streak' as Tab,
        target: 10,
        coins: 0,
        gachaTickets: 0,
        rewardItems: [] as string[],
    });

    const [levelForm, setLevelForm] = useState({
        level: 1,
        xpRequired: 0,
        coinReward: 0,
        gachaTickets: 0,
        rewardItems: [] as string[],
        unlockDescription: ''
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [msData, rwData, lvlData] = await Promise.all([
                adminApi.getMilestones(),
                adminApi.getAllRewards(),
                adminApi.getLevels()
            ]);
            setMilestones(msData.milestones);
            setRewardsList(rwData.rewards);
            setLevels(lvlData.levels || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openCreate = () => {
        setEditMode(null);
        setForm({
            type: tab,
            target: 10,
            coins: 0,
            gachaTickets: 0,
            rewardItems: [],
        });
        setShowModal(true);
    };

    const openEdit = (m: Milestone) => {
        setEditMode(m);
        setForm({
            type: m.type,
            target: m.target,
            coins: m.coins,
            gachaTickets: m.gachaTickets || 0,
            rewardItems: m.rewardItems.map(r => r._id),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editMode) {
                await adminApi.updateMilestone(editMode._id, form);
            } else {
                await adminApi.createMilestone(form);
            }
            setShowModal(false);
            fetchData();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa mốc thưởng này?')) return;
        try {
            await adminApi.deleteMilestone(id);
            fetchData();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const toggleRewardItem = (id: string) => {
        setForm(prev => {
            if (prev.rewardItems.includes(id)) {
                return { ...prev, rewardItems: prev.rewardItems.filter(rid => rid !== id) };
            } else {
                return { ...prev, rewardItems: [...prev.rewardItems, id] };
            }
        });
    };

    const toggleLevelRewardItem = (id: string) => {
        setLevelForm(prev => {
            if (prev.rewardItems.includes(id)) {
                return { ...prev, rewardItems: prev.rewardItems.filter(rid => rid !== id) };
            } else {
                return { ...prev, rewardItems: [...prev.rewardItems, id] };
            }
        });
    };

    // LEVEL FUNCTIONS
    const openCreateLevel = () => {
        setEditLevelMode(null);
        setLevelForm({
            level: levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1,
            xpRequired: 0,
            coinReward: 0,
            gachaTickets: 0,
            rewardItems: [],
            unlockDescription: ''
        });
        setShowLevelModal(true);
    };

    const openEditLevel = (lvl: Level) => {
        setEditLevelMode(lvl);
        setLevelForm({
            level: lvl.level,
            xpRequired: lvl.xpRequired,
            coinReward: lvl.coinReward || 0,
            gachaTickets: lvl.gachaTickets || 0,
            rewardItems: lvl.rewardItems ? lvl.rewardItems.map(r => r._id) : [],
            unlockDescription: lvl.unlockDescription || ''
        });
        setShowLevelModal(true);
    };

    const handleSaveLevel = async () => {
        if (levelForm.level <= 0) {
            setError('Cấp độ phải lớn hơn 0');
            return;
        }
        try {
            setError('');
            if (editLevelMode) {
                await adminApi.updateLevel(editLevelMode._id, levelForm);
            } else {
                await adminApi.createLevel(levelForm);
            }
            setShowLevelModal(false);
            fetchData();
        } catch (e: any) {
            setError(e.message || 'Lưu thất bại. Có thể do bị trùng Số Cấp.');
        }
    };

    const handleDeleteLevel = async (id: string, levelNum: number) => {
        if (!window.confirm(`Xác nhận xóa cấp độ ${levelNum}?`)) return;
        try {
            await adminApi.deleteLevel(id);
            fetchData();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const filteredMilestones = milestones.filter(m => m.type === tab);

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Quản lý Phần thưởng (Auto)</h1>
                <p className="page__subtitle">Cài đặt các mốc tự động thưởng Gacha, Coin, và Quà tặng cho người chơi</p>
            </div>

            {error && (
                <div style={{ padding: '10px 16px', background: 'var(--danger-light)', color: '#991b1b', borderRadius: 8, marginBottom: 16 }}>
                    ❌ {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
            )}

            <div className="tabs">
                <button className={`tabs__tab${tab === 'levels' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('levels')}>
                    ⭐ Cấp độ (RPG)
                </button>
                <button className={`tabs__tab${tab === 'streak' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('streak')}>
                    🔥 Chuỗi tương tác (Streak)
                </button>
                <button className={`tabs__tab${tab === 'spending' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('spending')}>
                    💸 Chi tiêu tích lũy (Spending)
                </button>
            </div>

            {tab === 'levels' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">⭐ Lộ trình Cấp độ ({levels.length})</span>
                        <button className="btn btn--primary" onClick={openCreateLevel}>+ Thêm cấp độ</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">⏳</div>
                            </div>
                        ) : levels.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">⭐</div>
                                <div className="empty-state__text">Chưa có cấu hình cấp độ nào. Bấm "Thêm cấp độ" để bắt đầu!</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Cấp</th>
                                        <th>XP Tối thiểu</th>
                                        <th>🪙 Thưởng Coin</th>
                                        <th>🎟️ Vé Gacha</th>
                                        <th>🎁 Quà tặng</th>
                                        <th>Chức năng mở khóa</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {levels.map(lvl => (
                                        <tr key={lvl._id}>
                                            <td style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>LV. {lvl.level}</td>
                                            <td style={{ fontWeight: 500 }}>{lvl.xpRequired.toLocaleString()} XP</td>
                                            <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                                                {lvl.coinReward > 0 ? `+${lvl.coinReward}` : '—'}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#ec4899' }}>
                                                {lvl.gachaTickets && lvl.gachaTickets > 0 ? `+${lvl.gachaTickets}` : '—'}
                                            </td>
                                            <td>
                                                {lvl.rewardItems && lvl.rewardItems.length > 0 ? (
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {lvl.rewardItems.map((item: any) => (
                                                            <span key={item._id || item} className="badge badge--info" style={{ fontSize: 11, padding: '2px 6px' }}>
                                                                {item.title || 'Quà'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>Không có</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500, color: lvl.unlockDescription ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                    {lvl.unlockDescription || 'Không có'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--secondary btn--sm" onClick={() => openEditLevel(lvl)}>✏️ Sửa</button>
                                                    <button className="btn btn--danger btn--sm" onClick={() => handleDeleteLevel(lvl._id, lvl.level)}>🗑️</button>
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

            {tab !== 'levels' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">
                            {tab === 'streak' ? '🔥 Mốc thưởng theo chuỗi ngày' : '💸 Mốc thưởng theo tổng chi tiêu Coins'}
                        </span>
                        <button className="btn btn--primary" onClick={openCreate}>+ Thêm mốc mới</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state"><div className="empty-state__icon">⏳</div></div>
                        ) : filteredMilestones.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">🎯</div>
                                <div className="empty-state__text">Chưa cấu hình mốc thưởng nào.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mốc yêu cầu</th>
                                        <th>🪙 Thưởng Coin</th>
                                        <th>🎟️ Thưởng Vé Gacha</th>
                                        <th>🎁 Quà tặng (Shop Items)</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMilestones.map(m => (
                                        <tr key={m._id}>
                                            <td style={{ fontWeight: 700, fontSize: 16 }}>
                                                {tab === 'streak' ? `${m.target} Ngày` : `${m.target.toLocaleString()} Coins`}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#f59e0b' }}>
                                                {m.coins > 0 ? `+${m.coins.toLocaleString()}` : '—'}
                                            </td>
                                            <td style={{ fontWeight: 600, color: '#ec4899' }}>
                                                {m.gachaTickets > 0 ? `+${m.gachaTickets}` : '—'}
                                            </td>
                                            <td>
                                                {m.rewardItems.length > 0 ? (
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {m.rewardItems.map(item => (
                                                            <span key={item._id} className="badge badge--info" style={{ fontSize: 11, padding: '2px 6px' }}>
                                                                {item.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>Không có</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(m)}>✏️ Sửa</button>
                                                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(m._id)}>🗑️</button>
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

            {/* CREATE / EDIT MODAL FOR REWARDS */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editMode ? '✏️ Cập nhật Mốc' : '➕ Tạo Mốc Thưởng Mới'}</span>
                            <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label>Loại mốc</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Tab })} disabled={!!editMode}>
                                    <option value="streak">🔥 Chuỗi ngày liên tiếp (Streak)</option>
                                    <option value="spending">💸 Tổng số Coins đã tiêu</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Mục tiêu để nhận thưởng ({form.type === 'streak' ? 'Ngày' : 'Coins'}) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.target}
                                    onChange={e => setForm({ ...form, target: Number(e.target.value) })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>🪙 Tặng thêm Coins</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.coins}
                                        onChange={e => setForm({ ...form, coins: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>🎟️ Tặng Vé Gacha</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.gachaTickets}
                                        onChange={e => setForm({ ...form, gachaTickets: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 8 }}>
                                <label>🎁 Tặng Đặc Quyền (Shop Items dưới dạng Product Tickets)</label>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                    Chọn các phần quà từ cửa hàng. Người chơi sẽ được nhận MIỄN PHÍ vào mục "Quà tặng" khi đạt mốc này.
                                </div>

                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                                    maxHeight: 240, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--card-border)'
                                }}>
                                    {rewardsList.map(r => {
                                        const isSelected = form.rewardItems.includes(r._id);
                                        return (
                                            <div
                                                key={r._id}
                                                onClick={() => toggleRewardItem(r._id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, padding: 8,
                                                    background: isSelected ? 'var(--accent-light)' : 'white',
                                                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                                                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {r.imageUrl ? (
                                                    <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                                                ) : <div style={{ width: 32, height: 32, background: '#eee', borderRadius: 6 }}></div>}
                                                <div style={{ flex: 1, fontSize: 13 }}>
                                                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                                                    <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>🪙 {r.pointCost}</div>
                                                </div>
                                                <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                                                    {isSelected && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={form.target <= 0}>
                                {editMode ? '💾 Lưu thay đổi' : '🚀 Thêm móc thưởng'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE/EDIT MODAL FOR LEVELS */}
            {showLevelModal && (
                <div className="modal-backdrop" onClick={() => setShowLevelModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal__header">
                            <span className="modal__title">{editLevelMode ? `✏️ Sửa Cấp ${levelForm.level}` : '➕ Tạo Cấp độ mới'}</span>
                            <button className="modal__close" onClick={() => setShowLevelModal(false)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Số Cấp độ *</label>
                                    <input
                                        type="number"
                                        value={levelForm.level}
                                        onChange={e => setLevelForm({ ...levelForm, level: Number(e.target.value) })}
                                        min={1}
                                        disabled={!!editLevelMode}
                                        style={{ background: editLevelMode ? '#f3f4f6' : 'white' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>XP Yêu cầu *</label>
                                    <input
                                        type="number"
                                        value={levelForm.xpRequired}
                                        onChange={e => setLevelForm({ ...levelForm, xpRequired: Number(e.target.value) })}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                <div className="form-group">
                                    <label>🪙 Coin Thưởng (khi đạt cấp)</label>
                                    <input
                                        type="number"
                                        value={levelForm.coinReward}
                                        onChange={e => setLevelForm({ ...levelForm, coinReward: Number(e.target.value) })}
                                        min={0}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>🎟️ Tặng Vé Gacha</label>
                                    <input
                                        type="number"
                                        value={levelForm.gachaTickets}
                                        onChange={e => setLevelForm({ ...levelForm, gachaTickets: Number(e.target.value) })}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 8 }}>
                                <label>🎁 Tặng Đặc Quyền (Shop Items dưới dạng Product Tickets)</label>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                    Chọn các phần quà từ cửa hàng. Người chơi sẽ được nhận MIỄN PHÍ vào mục "Quà tặng" khi đạt cấp này.
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                                    maxHeight: 240, overflowY: 'auto', padding: 8, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--card-border)'
                                }}>
                                    {rewardsList.map(r => {
                                        const isSelected = levelForm.rewardItems.includes(r._id);
                                        return (
                                            <div
                                                key={r._id}
                                                onClick={() => toggleLevelRewardItem(r._id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, padding: 8,
                                                    background: isSelected ? 'var(--accent-light)' : 'white',
                                                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                                                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                {r.imageUrl ? (
                                                    <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                                                ) : <div style={{ width: 32, height: 32, background: '#eee', borderRadius: 6 }}></div>}
                                                <div style={{ flex: 1, fontSize: 13 }}>
                                                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                                                    <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>🪙 {r.pointCost}</div>
                                                </div>
                                                <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--accent)' : 'transparent' }}>
                                                    {isSelected && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mô tả Đặc quyền (Tùy chọn)</label>
                                <input
                                    type="text"
                                    value={levelForm.unlockDescription}
                                    onChange={e => setLevelForm({ ...levelForm, unlockDescription: e.target.value })}
                                    placeholder="Ví dụ: Mở khóa mua Khung Avatar Bạc"
                                />
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Cái này sẽ hiển thị lên giao diện Roadmap và Thông báo thăng cấp.
                                </div>
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowLevelModal(false)}>Hủy</button>
                            <button className="btn btn--primary" onClick={handleSaveLevel}>
                                {editLevelMode ? '💾 Lưu thay đổi' : '🚀 Tạo Cấp độ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
