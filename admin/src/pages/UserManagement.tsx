import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

interface UserData {
    _id: string;
    username: string;
    email: string;
    role: string;
    coins: number;
    xp: number;
    level: number;
    currentPoints: number;
    totalPointsEarned: number;
    currentStreak: number;
    longestStreak: number;
    createdAt: string;
    updatedAt?: string;
    avatar?: string;
    settings: {
        pushNotifications: boolean;
        timezone: string;
    };
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [pointAdjust, setPointAdjust] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [total, setTotal] = useState(0);

    const fetchUsers = useCallback(async (searchTerm?: string) => {
        try {
            setLoading(true);
            const data = await adminApi.getUsers({ search: searchTerm });
            setUsers(data.users);
            setTotal(data.total);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(search || undefined);
        }, 400);
        return () => clearTimeout(timer);
    }, [search, fetchUsers]);

    const levelTitle = (lvl: number) => lvl >= 10 ? 'Master' : lvl >= 5 ? 'Adventurer' : 'Beginner';

    const handleAdjustPoints = async () => {
        if (!selectedUser || pointAdjust === 0) return;
        try {
            await adminApi.adjustPoints(selectedUser._id, pointAdjust, 'Admin adjustment');
            setSelectedUser(null);
            setPointAdjust(0);
            fetchUsers(search || undefined);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Quản lý Người chơi</h1>
                <p className="page__subtitle">Xem thông tin, lịch sử, và điều chỉnh điểm người chơi</p>
            </div>

            {error && (
                <div style={{ padding: '10px 16px', background: 'var(--danger-light)', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    ❌ {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            <div className="action-row">
                <div className="action-row__left">
                    <input
                        type="text"
                        placeholder="🔍 Tìm theo tên hoặc email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 320 }}
                    />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{total} người chơi</span>
            </div>

            <div className="card">
                <div className="card__body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">⏳</div>
                            <div className="empty-state__text">Đang tải...</div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state__icon">👥</div>
                            <div className="empty-state__text">Không tìm thấy người chơi nào</div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Người chơi</th>
                                    <th>Level</th>
                                    <th>🪙 Coins</th>
                                    <th>Streak</th>
                                    <th>Ngày tạo</th>
                                    <th>Lần truy cập cuối</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: '50%',
                                                        background: 'var(--accent-light)', color: 'var(--accent)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: 14, flexShrink: 0,
                                                    }}>
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge--info">Lv.{u.level} {levelTitle(u.level)}</span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#f59e0b' }}>🪙 {u.coins.toLocaleString()}</td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>🔥 {u.currentStreak}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> / {u.longestStreak} max</span>
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td>
                                            <button className="btn btn--secondary btn--sm" onClick={() => { setSelectedUser(u); setPointAdjust(0); }}>
                                                👁️ Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedUser && (
                <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <div className="modal__header">
                            <span className="modal__title">👤 Chi tiết: {selectedUser.username}</span>
                            <button className="modal__close" onClick={() => setSelectedUser(null)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div className="card" style={{ background: 'var(--content-bg)' }}>
                                    <div className="card__body" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>🪙 Coins</div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{selectedUser.coins.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="card" style={{ background: 'var(--content-bg)' }}>
                                    <div className="card__body" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>⭐ XP</div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{selectedUser.xp.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="card" style={{ background: 'var(--content-bg)' }}>
                                    <div className="card__body" style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>🔥 Streak</div>
                                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{selectedUser.currentStreak}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 20 }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{selectedUser.email}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Level:</span> <strong>Lv.{selectedUser.level} {levelTitle(selectedUser.level)}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Tổng XP:</span> <strong>{selectedUser.totalPointsEarned.toLocaleString()}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Streak dài nhất:</span> <strong>{selectedUser.longestStreak} ngày</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Ngày tạo:</span> <strong>{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Thông báo:</span> <strong>{selectedUser.settings?.pushNotifications ? '✅ Bật' : '❌ Tắt'}</strong></div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 16 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⚖️ Điều chỉnh điểm thủ công</div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <input
                                        type="number"
                                        value={pointAdjust}
                                        onChange={e => setPointAdjust(Number(e.target.value))}
                                        style={{ width: 120 }}
                                        placeholder="VD: 100 hoặc -50"
                                    />
                                    <button className="btn btn--primary btn--sm" onClick={handleAdjustPoints}>
                                        {pointAdjust >= 0 ? '➕ Cộng điểm' : '➖ Trừ điểm'}
                                    </button>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                    Nhập số dương để cộng, số âm để trừ. VD: 100 = cộng 100 XP, -50 = trừ 50 XP.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
