import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import { MilestoneModal, LevelModal } from '../components/reward';

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
    type: 'streak';
    target: number;
    coins: number;
    gachaTickets: number;
    rewardItems: RewardItem[];
}

type Tab = 'levels' | 'streak';

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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [ms, rw, lvls] = await Promise.all([
                adminApi.getMilestones(),
                adminApi.getAllRewards(),
                adminApi.getLevels(),
            ]);
            setMilestones(ms.milestones || []);
            setRewardsList(rw.rewards || []);
            setLevels(lvls.levels || []);
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
        setShowModal(true);
    };

    const openEdit = (m: Milestone) => {
        setEditMode(m);
        setShowModal(true);
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

    const openCreateLevel = () => {
        setEditLevelMode(null);
        setShowLevelModal(true);
    };

    const openEditLevel = (lvl: Level) => {
        setEditLevelMode(lvl);
        setShowLevelModal(true);
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
                    🔥 Chuỗi truy cập (Streak)
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

            {tab === 'streak' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">
                            🔥 Mốc thưởng theo chuỗi ngày
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
                                                {m.target} Ngày
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
            <MilestoneModal
                isOpen={showModal}
                editMode={editMode}
                rewardsList={rewardsList}
                onClose={() => setShowModal(false)}
                onSaveSuccess={fetchData}
            />

            {/* CREATE/EDIT MODAL FOR LEVELS */}
            <LevelModal
                isOpen={showLevelModal}
                editLevelMode={editLevelMode}
                rewardsList={rewardsList}
                onClose={() => setShowLevelModal(false)}
                onSaveSuccess={fetchData}
            />
        </div>
    );
}
