import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import type { Reward, Voucher } from '../types';
import { VipConfigTab, VoucherRedeemTab, RewardFormModal, ShopEventTab } from '../components/shop';

type ShopTab = 'shelf' | 'warehouse' | 'redeem' | 'vip' | 'events';

export default function ShopRedemption() {
    const [tab, setTab] = useState<ShopTab>('shelf');
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [editReward, setEditReward] = useState<Reward | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [error, setError] = useState('');
    const [vipTiers, setVipTiers] = useState<any[]>([]);

    const fetchRewards = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getAllRewards();
            setRewards(data.rewards);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchVouchers = useCallback(async () => {
        try {
            const data = await adminApi.getAllVouchers();
            setVouchers(data.vouchers);
        } catch (e: any) {
            setError(e.message);
        }
    }, []);

    const fetchVipTiers = useCallback(async () => {
        try {
            const res = await adminApi.getVipConfig();
            
            const defaultTiers = [
                { tier: 0,  minSpending: 0, name: 'Lữ Khách', cashbackPercent: 0, color: '#9E9E9E', icon: '🚶' },
                { tier: 1,  minSpending: 30000, name: 'Thương Nhân', cashbackPercent: 1, color: '#8D6E63', icon: '💼' },
                { tier: 2,  minSpending: 80000, name: 'Thương Nhân Giàu', cashbackPercent: 2, color: '#795548', icon: '💰' },
                { tier: 3,  minSpending: 150000, name: 'Hào Phú', cashbackPercent: 3, color: '#78909C', icon: '🎩' },
                { tier: 4,  minSpending: 250000, name: 'Quý Tộc', cashbackPercent: 5, color: '#90A4AE', icon: '🏅' },
                { tier: 5,  minSpending: 370000, name: 'Bá Tước', cashbackPercent: 6, color: '#FFD54F', icon: '🥉' },
                { tier: 6,  minSpending: 500000, name: 'Hầu Tước', cashbackPercent: 8, color: '#FFC107', icon: '🥈' },
                { tier: 7,  minSpending: 640000, name: 'Công Tước', cashbackPercent: 10, color: '#00BCD4', icon: '🥇' },
                { tier: 8,  minSpending: 780000, name: 'Vương Tôn', cashbackPercent: 12, color: '#26C6DA', icon: '🌟' },
                { tier: 9,  minSpending: 870000, name: 'Lãnh Chúa', cashbackPercent: 14, color: '#E91E63', icon: '🏰' },
                { tier: 10, minSpending: 940000, name: 'Hoàng Thân', cashbackPercent: 17, color: '#AB47BC', icon: '👑' },
                { tier: 11, minSpending: 1000000, name: 'Hoàng Gia', cashbackPercent: 20, color: '#F9A825', icon: '💎' },
            ];

            if (res && res.tiers && res.tiers.length > 0) {
                // Merge DB config with defaults to ensure missing fields (color, icon) are filled
                const merged = res.tiers.map((t: any, index: number) => {
                    const dt = defaultTiers[index] || defaultTiers[0];
                    return {
                        tier: t.tier ?? dt.tier,
                        name: t.name ?? dt.name,
                        minSpending: t.minSpending ?? dt.minSpending,
                        cashbackPercent: t.cashbackPercent ?? dt.cashbackPercent,
                        color: (t.color && t.color.startsWith('#')) ? t.color : dt.color,
                        icon: (t.icon && t.icon.trim() !== '') ? t.icon : dt.icon,
                    };
                });
                setVipTiers(merged);
            } else {
                setVipTiers(defaultTiers);
            }
        } catch (e: any) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
        fetchVouchers();
        fetchVipTiers();
    }, [fetchRewards, fetchVouchers, fetchVipTiers]);

    const shelfItems = rewards.filter(r => r.isActive);
    const warehouseItems = rewards.filter(r => !r.isActive);

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await adminApi.updateReward(id, { isActive });
            fetchRewards();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const openCreate = () => {
        setEditReward(null);
        setShowCreate(true);
    };

    const openEdit = (r: Reward) => {
        setEditReward(r);
        setShowCreate(true);
    };

    const pendingCount = vouchers.filter(v => v.status === 'pending_use').length;

    return (
        <div className="page">
            <div className="page__header">
                <h1 className="page__title">Cửa hàng & Đổi quà</h1>
                <p className="page__subtitle">Quản lý kệ hàng, kho quà, và xử lý đổi quà</p>
            </div>

            {error && (
                <div style={{ padding: '10px 16px', background: 'var(--danger-light)', color: '#991b1b', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    ❌ {error}
                    <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            )}

            <div className="tabs">
                <button className={`tabs__tab${tab === 'shelf' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('shelf')}>
                    🏪 Trên kệ ({shelfItems.length})
                </button>
                <button className={`tabs__tab${tab === 'warehouse' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('warehouse')}>
                    📦 Trong kho ({warehouseItems.length})
                </button>
                <button className={`tabs__tab${tab === 'redeem' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('redeem')}>
                    🎫 Đổi quà {pendingCount > 0 && <span className="sidebar__badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
                </button>
                <button className={`tabs__tab${tab === 'vip' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('vip')}>
                    👑 Thẻ hạng
                </button>
                <button className={`tabs__tab${tab === 'events' ? ' tabs__tab--active' : ''}`} onClick={() => setTab('events')}>
                    ⚡ Sự kiện Shop
                </button>
            </div>

            {/* TAB: Sự kiện Shop */}
            {tab === 'events' && (
                <ShopEventTab />
            )}

            {/* TAB: Trên kệ */}
            {tab === 'shelf' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">🏪 Quà đang hiển thị cho người chơi</span>
                        <button className="btn btn--primary" onClick={openCreate}>+ Thêm quà mới</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">⏳</div>
                                <div className="empty-state__text">Đang tải...</div>
                            </div>
                        ) : shelfItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">🏪</div>
                                <div className="empty-state__text">Chưa có quà trên kệ. Thêm quà mới hoặc đưa từ kho lên!</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tên quà</th>
                                        <th>Giá (Coins)</th>
                                        <th>Tồn kho</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shelfItems.map(r => (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {r.imageUrl ? (
                                                        <img src={r.imageUrl} alt={r.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎁</div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{r.title} {r.isFeatured && <span title="Nổi bật" style={{ color: '#f59e0b' }}>⭐</span>}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#f59e0b' }}>🪙 {r.pointCost}</td>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>{r.stock ?? '∞'}</span>
                                                {r.stock !== undefined && r.stock <= 5 && (
                                                    <span className="badge badge--danger" style={{ marginLeft: 8 }}>Sắp hết</span>
                                                )}
                                            </td>
                                            <td><span className="badge badge--success">Đang hiển thị</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(r)}>✏️ Sửa</button>
                                                    <button className="btn btn--secondary btn--sm" onClick={() => handleToggleActive(r._id, false)}>📦 Cất kho</button>
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

            {/* TAB: Trong kho */}
            {tab === 'warehouse' && (
                <div className="card">
                    <div className="card__header">
                        <span className="card__title">📦 Quà trong kho (ẩn với người chơi)</span>
                        <button className="btn btn--primary" onClick={openCreate}>+ Thêm quà mới</button>
                    </div>
                    <div className="card__body" style={{ padding: 0 }}>
                        {warehouseItems.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon">📦</div>
                                <div className="empty-state__text">Kho trống! Tất cả quà đều đang trên kệ.</div>
                            </div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tên quà</th>
                                        <th>Giá (Coins)</th>
                                        <th>Tồn kho</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouseItems.map(r => (
                                        <tr key={r._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {r.imageUrl ? (
                                                        <img src={r.imageUrl} alt={r.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎁</div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{r.title} {r.isFeatured && <span title="Nổi bật" style={{ color: '#f59e0b' }}>⭐</span>}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>🪙 {r.pointCost}</td>
                                            <td><span style={{ fontWeight: 600 }}>{r.stock ?? '∞'}</span></td>
                                            <td><span className="badge badge--danger">Trong kho</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(r)}>✏️ Sửa</button>
                                                    <button className="btn btn--success btn--sm" onClick={() => handleToggleActive(r._id, true)}>🏪 Đưa lên kệ</button>
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

            {/* TAB: Đổi quà */}
            {tab === 'redeem' && (
                <VoucherRedeemTab vouchers={vouchers} fetchVouchers={fetchVouchers} />
            )}

            {/* TAB: Thẻ hạng */}
            {tab === 'vip' && (
                <VipConfigTab vipTiers={vipTiers} setVipTiers={setVipTiers} />
            )}

            {/* Create/Edit Modal */}
            <RewardFormModal
                isOpen={!!editReward || showCreate}
                editReward={editReward}
                onClose={() => { setEditReward(null); setShowCreate(false); }}
                onSaveSuccess={fetchRewards}
            />
        </div>
    );
}
